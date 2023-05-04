import React, { useState } from 'react';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import HttpsProxyAgent from 'https-proxy-agent';
import Papa from 'papaparse';
import './App.css';

dotenv.config();

function App() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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
    let products = [];
    let paginator = 0;
    let lastPage = 0;

    const rotateWithBrightData = async () => {
      const url = `https://www.amazon.com/s?k=${searchTerm}` + (paginator > 0 ? `&page=${paginator}` : '');
      const response = await fetch(url, {
        agent: new HttpsProxyAgent(`https://${process.env.luminatiUsername}-session-rand${Math.ceil(Math.random() * 10000000)}:${process.env.luminatiPassword}@zproxy.lum-superproxy.io:22225`)
      });
      const html = await response.text();
      return html;
    };

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while (paginator <= lastPage) {
      const html = await rotateWithBrightData();
      const parsedProducts = parseProducts(html);
      products = products.concat(parsedProducts);
      if (paginator === 0) {
        lastPage = getLastPage(html);
      }
      paginator++;
      await delay(500);
    }

    downloadCsv(products);
  };

  const handleSearchTermChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const parseProducts = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const products = Array.from(doc.querySelectorAll('div[data-component-type="s-search-result"]')).map((item) => {
      const asinValue = item.dataset.asin;
      const title = item.querySelector('h2')?.textContent.trim() ?? '';
      const priceSymbol = item.querySelector('span.a-price-symbol')?.textContent.trim() ?? '';
      const priceWhole = item.querySelector('span.a-price-whole')?.textContent.trim() ?? '';
      const priceFraction = item.querySelector('span.a-price-fraction')?.textContent.trim() ?? '';
      const imageProductNew = item.querySelector('img.s-image')?.src.trim() ?? '';
      const imageProduct = imageProductNew.replace(/._.*(?=\.jpg)/, '') + ".jpg";
      const price = priceWhole && priceFraction ? `${priceWhole}${priceFraction}` : "0";
      return { asinValue, title, imageProduct, priceSymbol, price };
    });

    return products;
  };

  const getLastPage = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const linkValue = doc.querySelectorAll('.s-pagination-container .s-pagination-disabled');
    return parseInt(linkValue[linkValue.length - 1].textContent);
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