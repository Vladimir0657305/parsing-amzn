import React, { useState } from 'react';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import HttpsProxyAgent from 'https-proxy-agent';
import axios from 'axios';
import Papa from 'papaparse';
import './App.css';

dotenv.config();




function App() {
    const [data, setData] = useState([]);
    let paginator = undefined;
    let products = [];
    const [searchTerm, setSearchTerm] = useState('');
    let link = 0;
    let lastPage = 0;

    async function rotateWithBrightData() {
        // const url = 'https://lumtest.com/myip.json';
        const url = `https://www.amazon.com/s?k=${searchTerm}`;

        // const response = await fetch(url, {
        // agent: new HttpsProxyAgent.HttpsProxyAgent(`https://${process.env.luminatiUsername}-session-rand${Math.ceil(Math.random() * 10000000)}:${process.env.luminatiPassword}@zproxy.lum-superproxy.io:22225`)
        // agent: new HttpsProxyAgent.HttpsProxyAgent(`https://${process.env.luminatiUsername}-session-rand7:${process.env.luminatiPassword}@zproxy.lum-superproxy.io:22225`)
        // });
        if (paginator == 0) {
            const url = `https://www.amazon.com/s?k=${searchTerm}`;
            const response = await fetch(url, {
                agent: new HttpsProxyAgent.HttpsProxyAgent(`https://${process.env.luminatiUsername}-session-rand${Math.ceil(Math.random() * 10000000)}:${process.env.luminatiPassword}@zproxy.lum-superproxy.io:22225`)
            });
        } else {
            const url = `https://www.amazon.com/s?k=${searchTerm}&page=${paginator}`;
            const response = await fetch(url, {
                agent: new HttpsProxyAgent.HttpsProxyAgent(`https://${process.env.luminatiUsername}-session-rand${Math.ceil(Math.random() * 10000000)}:${process.env.luminatiPassword}@zproxy.lum-superproxy.io:22225`)
            });
        }
        // const html = await response.text();
        const html = await response();
        return html;

        // const json = await response.json();
        // console.log('json', json);
    };

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // const fetchData = async (url) => {
    //     const response = await axios.get(url);
    //     return response.data;
    // };

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
                let response = rotateWithBrightData().then(html => {
                    console.log(html);
                }).catch(error => {
                    console.error(error);
                });
                products = parseProducts(response);
                index++;
                paginator = index;
            } else {
                // const delayTime = Math.floor(Math.random() * 3001) + 2000;
                // await delay(delayTime);
                let response = rotateWithBrightData().then(html => {
                    console.log(html);
                }).catch(error => {
                    console.error(error);
                });
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
