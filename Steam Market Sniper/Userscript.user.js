// ==UserScript==
// @name         Steam Market Sniper
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  try to take over the world!
// @author       Pei
// @match        https://steamcommunity.com/
// @grant        none
// @run-at       document-end
// ==/UserScript==

let itemsToSnipe = [
        { name: "★ StatTrak™ Classic Knife | Case Hardened (Battle-Scarred)", limit: 147 },
        { name: "★ StatTrak™ Classic Knife | Case Hardened (Well-Worn)", limit: 147 },
        { name: "★ StatTrak™ Bayonet | Damascus Steel (Battle-Scarred)", limit: 147 },
];

let myPrices = [];
let failedOrders = [];
let itemHistograms = [];
const parser = new DOMParser();
const getDOMByUrl = (url) => {
        return new Promise(async (resolve, reject) => {
                fetch(url).then(response => {
                        if (response.ok) {
                                return response.text();
                        }
                        throw new Error('Failed to Open: ' + url);
                }).then(data => {
                        resolve(parser.parseFromString(data, "text/html"));
                }).catch(error => {
                        reject(error);
                });
        });
}

const getInfoByNames = (names) => {
        return new Promise(async (resolve, reject) => {
                try {
                        let remainingNames = Array.from(names);
                        let doc = await getDOMByUrl("https://steamcommunity.com/market/");
                        let infoResult = [];
                        let listings = Array.from(doc.querySelectorAll(".market_listing_item_name_link"));
                        if (doc.querySelectorAll(".market_listing_row[id*='mybuyorder']").length === 0) {
                                throw new Error("Listing Not Loaded Correctly");
                        }
                        for (const listing of listings) {
                                let target = remainingNames.indexOf(listing.innerHTML);
                                if (target > -1 && listing.parentElement.id.includes('mbuyorder')) {
                                        let info = {};
                                        info.name = listing.innerHTML;
                                        info.orderId = listing.parentElement.id;
                                        info.price = parseFloat(listing.parentElement.parentElement.parentElement.querySelectorAll(".market_listing_price")[0].innerHTML.trim().split("$")[1]);
                                        info.url = listing.href || null;
                                        info.orderId = info.orderId.substring(info.orderId.indexOf('_') + 1, info.orderId.lastIndexOf('_')) || null;
                                        infoResult.push(info);
                                        remainingNames.splice(target, 1);
                                }
                        };
                        resolve([infoResult, remainingNames]);
                } catch (error) {
                        reject(error);
                }
        });
}

const getItemIdsByUrls = (urls) => {
        return new Promise(async (resolve, reject) => {
                try {
                        let results = {};
                        for (let index = 0; index < urls.length; index++) {
                                let response = await fetch(urls[index].url);
                                if (response.ok) {
                                        let data = await response.text();
                                        if (data.match(/Market_LoadOrderSpread\( (.*) \);/)) {
                                                results[urls[index].name] = data.match(/Market_LoadOrderSpread\( (.*) \);/)[1];
                                                continue;
                                        }
                                }
                                throw new Error('Failed to Open: ' + urls[index].url);
                        }
                        resolve(results);
                } catch (error) {
                        reject(error);
                };
        });
}

const getJSONPrice = (itemId) => {
        return new Promise((resolve, reject) => {
                fetch('https://steamcommunity.com/market/itemordershistogram?country=US&language=english&currency=1&item_nameid=' + itemId + '&two_factor=0').then(response => {
                        if (response.ok) {
                                return response.text();
                        }
                        throw new Error(itemId);
                }).then(data => {
                        resolve(JSON.parse(data));
                }).catch(error => {
                        reject('getJSONPrice Error: ' + error);
                });
        });
}

const relistBuyOrder = (orderId, price, appid, hashName) => {
        return new Promise(async (resolve, reject) => {
                let cPrice = price.toFixed(2).toString().replace(".", "");
                let searchParams = new URLSearchParams();
                let params = {
                        sessionid: g_sessionID,
                        buy_orderid: orderId
                };
                for (const prop in params) {
                        searchParams.set(prop, params[prop]);
                }
                let searchParams2 = new URLSearchParams();
                let params2 = {
                        sessionid: g_sessionID,
                        currency: "1",
                        appid: appid,
                        market_hash_name: hashName,
                        price_total: cPrice,
                        quantity: "1"
                };
                for (const prop in params2) {
                        searchParams2.set(prop, params2[prop]);
                }
                try {
                        let cancelResult = await cancelBuyOrder(searchParams);
                        if (cancelResult.success === 1) {
                                let orderResult = await createBuyOrder(searchParams2);
                                if (orderResult.success === 1) {
                                        console.log(hashName + " ordered with $" + price + " at " + new Date().toLocaleTimeString());
                                        resolve("Operation Done");
                                        return;
                                }
                        }
                        throw new Error(hashName + " createOrder failed with $" + price + " at " + new Date().toLocaleTimeString() + ", will retry again soon.");
                } catch (error) {
                        failedOrders[hashName] = [searchParams2, price];
                        reject(error);
                }
        });
}

const cancelBuyOrder = (params) => {
        return new Promise(async (resolve, reject) => {
                try {
                        let response = await fetch('/market/cancelbuyorder', {
                                method: 'POST',
                                headers: {
                                        "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                                },
                                referrer: "https://steamcommunity.com/market/",
                                body: params,
                        });
                        if (response.ok) {
                                let data = await response.json();
                                resolve(data);
                        } else {
                                throw new Error('cancelBuyOrder-> ' + response);
                        }
                } catch (error) {
                        reject(error);
                }
        });
}

const createBuyOrder = (params) => {
        return new Promise(async (resolve, reject) => {
                try {
                        let response = await fetch('/market/createbuyorder', {
                                method: 'POST',
                                headers: {
                                        "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                                },
                                referrer: "https://steamcommunity.com/market/",
                                body: params,
                        });
                        if (response.ok) {
                                let data = await response.json();
                                resolve(data);
                        } else {
                                throw new Error('createBuyOrder-> ' + response);
                        }
                } catch (error) {
                        reject(error);
                }
        });
}

const work = () => {
        return new Promise(async (resolve) => {
                try {
                        let itemsToSnipeNames = itemsToSnipe.reduce((a, b) => {
                                return a.concat(b.name);
                        }, []);
                        let info = await getInfoByNames(itemsToSnipeNames);//[{name,orderId,price,url},{name1,orderId1,price1,url1}....,[(remaining names that are not found)]]
                        if (info[1].length > 0) {
                                for (let index = 0; index < info[1].length; index++) {
                                        let itemName = info[1][index];
                                        if (failedOrders[itemName] == null) {
                                                let target = itemsToSnipeNames.indexOf(itemName);
                                                itemsToSnipe.splice(target, 1);
                                                //itemHistograms.splice(target,1);
                                                delete itemHistograms[itemName];
                                                console.log(itemName + " is bought or canceled at " + new Date().toLocaleTimeString());
                                        } else {
                                                let data = await createBuyOrder(failedOrders[itemName][0]);
                                                if (data.success === 1) {
                                                        console.log(itemName + " reordered with $" + failedOrders[itemName][1] + " at " + new Date().toLocaleTimeString());
                                                        failedOrders[itemName] = null;
                                                } else {
                                                        console.log(itemName + " reorder failed with $" + failedOrders[itemName][1] + " at " + new Date().toLocaleTimeString() + ", will retry again soon.");
                                                }
                                        }
                                        //return;
                                }
                        }
                        /*let itemUrls=info[0].reduce((a,b)=>{
                            return a.concat(b[2]);
                        },[]);*/
                        //if(itemHistograms.length===0 && itemsToSnipe.length>0){
                        if (Object.keys(itemHistograms).length === 0 && itemsToSnipe.length > 0) {
                                itemHistograms = await getItemIdsByUrls(info[0]);//{(hashName):(itemId),(hashName1):(itemId1)......}
                        }
                        //if(itemId===null)return;
                        for (let index = 0; index < itemsToSnipe.length; index++) {
                                let name = itemsToSnipe[index].name;
                                let target = info[0].filter(x => { return x.name === name })[0];
                                let itemId = itemHistograms[name];
                                let priceObj = await getJSONPrice(itemId);//for retrieving purpose of price info
                                myPrices[itemId] = target.price;
                                let highestBuyPrice = priceObj.buy_order_graph[0][0];
                                let secondLowestBuyPrice = priceObj.buy_order_graph[1][0];
                                let appid = target.url.split("listings/")[1];
                                appid = appid.substring(0, appid.indexOf("/"));
                                if (highestBuyPrice > myPrices[itemId] && (highestBuyPrice + 0.03) <= itemsToSnipe[index].limit + 0.03) {
                                        await relistBuyOrder(target.orderId, Math.round((highestBuyPrice + 0.03) * 100) / 100, appid, target.name);
                                } else if (myPrices[itemId] > secondLowestBuyPrice + 0.04) {
                                        await relistBuyOrder(target.orderId, Math.round((secondLowestBuyPrice + 0.03) * 100) / 100, appid, target.name);
                                }
                        }
                } catch (error) {
                        console.log(error);
                }
                resolve("Work Cycle Done");
        });
}

let schedule = setInterval(async () => {
        if (itemsToSnipe.length === 0) {
                clearInterval(schedule);
                console.log("All done at " + new Date().toLocaleTimeString());
        };
        await work();
}, 60000);