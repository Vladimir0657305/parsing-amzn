import React, { useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import './App.css';

function App() {
    const [fig, setFig] = useState({});
    const [data, setData] = useState([]);
    const [proxyData, setProxyData] = useState('');
    const [error, setError] = useState(null);
    let paginator = undefined;
    let products = [];
    const [searchTerm, setSearchTerm] = useState('');
    const valueToRemove = 'http://localhost:3000';
    let hrefValuesArray = [];
    let link = 0;
    let lastPage = 0;

    const PROXY_URL = `https://api.allorigins.win/raw?url=`;
    const SEARCH_URL = `https://www.amazon.com/s?k=`;
    const NEXT_URL = `https://www.amazon.com`;



    const fetchResults = async (searchTerm) => {
        const api_key = process.env.BRIGHTDATA_API_KEY;
        const url = `https://api.brightdata.com/fiddler/direct?id=your_session_id&url=${encodeURIComponent(`https://www.amazon.com/s?k=${searchTerm}`)}`;

        const res = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${api_key}`,
            },
        });
        const data = await res.json();
        if (data.status === "building" || data.status === "collecting") {
            // console.log("NOT COMPLETE YET, TRY AGAIN...");
            return fetchResults(id);
        }
        return data;
    };





    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const fetchData = async (url) => {
        const response = await axios.get(url);
        return response.data;
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];

        Papa.parse(file, {
            header: true,
            complete: (result) => {
                setData(result.data);
            }
        });
    };

    const handleSearchSubmit = async (event) => {
        event.preventDefault();
        let index = 0;
        while (index <= lastPage) {
            // while (index <= 2) {
            if (paginator === undefined) {
                const temp = `${PROXY_URL}${SEARCH_URL}${searchTerm}`;
                console.log(temp);
                let response = await fetchData(`${PROXY_URL}${SEARCH_URL}${searchTerm}`);
                products = parseProducts(response);
                index++;
                paginator = index;
            } else {
                const delayTime = Math.floor(Math.random() * 3001) + 2000;
                await delay(delayTime);
                const temp = `${PROXY_URL}${SEARCH_URL}${searchTerm}&page=${paginator}`;
                console.log(temp);
                let response = await fetchData(`${PROXY_URL}${SEARCH_URL}${searchTerm}&page=${paginator}`);
                products = parseProducts(response);
                index++;
                paginator = index;
            }
        }
        downloadCsv(products);
    };

    const handleSearchTermChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const parseProducts = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        console.log(doc);

        let linkValue = doc.querySelectorAll('.s-pagination-container .s-pagination-disabled');
        console.log(linkValue);
        if (paginator === undefined) {
            lastPage = linkValue[linkValue.length - 1].textContent;
        }
        console.log('LASTPAGE=>', lastPage);
        // let link = doc.querySelector('li.a-last > a');
        // let temp = link?.href.replace(valueToRemove, '');
        // paginator = temp;
        // console.log('paginator=', paginator);

        doc.querySelectorAll('div[data-component-type="s-search-result"]').forEach((item) => {
            // console.log(item);
            const asinValue = item.dataset.asin;
            const title = item.querySelector('h2')?.textContent.trim() ?? '';
            const priceSymbol = item.querySelector('span.a-price-symbol')?.textContent.trim() ?? '';
            const priceWhole = item.querySelector('span.a-price-whole')?.textContent.trim() ?? '';
            const priceFraction = item.querySelector('span.a-price-fraction')?.textContent.trim() ?? '';
            const imageProductNew = item.querySelector('img.s-image')?.src.trim() ?? '';
            const imageProduct = imageProductNew.replace(/._.*(?=\.jpg)/, '') + ".jpg";
            // img.s-image
            // const price = parseFloat(`${priceWhole}.${priceFraction}`).toFixed(2);
            // if (priceWhole && priceFraction) {
            // price = parseFloat(`${priceWhole}.${priceFraction}`).toFixed(2);
            // }
            const price = priceWhole && priceFraction ? `${priceWhole}${priceFraction}` : "0";
            console.log(asinValue, title, imageProduct, priceSymbol, price);
            products.push({ asinValue, title, imageProduct, priceSymbol, price });
        });

        return products;
    };

    const downloadCsv = (products) => {
        const csv = Papa.unparse(products);
        const downloadLink = document.createElement('a');
        downloadLink.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
        downloadLink.setAttribute('download', `amazon-products_${searchTerm}.csv`);
        downloadLink.click();
    };
    return (
        <div className="app">
            <form onSubmit={handleSearchSubmit}>
                <input type="text" value={searchTerm} onChange={handleSearchTermChange} />
                <button type="submit">Parse Products</button>
            </form>
            <input type="file" onChange={handleFileUpload} />
            <table className='tabl'>
                <thead>
                    <tr>
                        <th>asinValue</th>
                        <th>title</th>
                        <th>imageProduct</th>
                        <th>priceSymbol</th>
                        <th>price</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index}>
                            <td>{row.asinValue}</td>
                            <td className='products_title'>{row.title}</td>
                            <td><img className='products_image' src={row.imageProduct} alt="Product" /></td>
                            <td className='products_symbol'>{row.priceSymbol}</td>
                            <td>{row.price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default App;
