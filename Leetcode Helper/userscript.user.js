// ==UserScript==
// @name         LeetCode Helper
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  try to take over the world!
// @author       Pei
// @match        https://leetcode.com/problems/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leetcode.com
// @grant        GM_xmlhttpRequest
// @connect      go.dev
// ==/UserScript==

(function() {
        'use strict';
        let timer,id,lang;
        localStorage.global_lang='"golang"';
    
        const init=()=>{
            timer=(
                setInterval(()=>{
                    const elem=document.querySelector('div[class*="error_"]');
                    const btns=document.querySelector('div[class*="btns"]');
                    if(btns.childElementCount==5){
                        for(let key in localStorage){
                            if(parseInt(key)>0){
                                const tmp=key.split("_");
                                id="_"+tmp[1]+"_";
                                break;
                            }
                        }
                        console.log(id);
    
                        const new_btn=document.createElement('button');
                        new_btn.innerText='format';
                        new_btn.onclick=format;
                        btns.append(new_btn);
                    }
    
                    if(elem){
                        const key_word=elem.innerText.split(" ")[4];
                        const button = Array.from(document.querySelectorAll('button>span')).find(el => el.textContent.toLowerCase().includes(key_word)).parentElement;
                        button.click();
                    }
                },1000)
            );
        }
    
        const format=async()=>{
            let buffer,table,lang=localStorage.global_lang.replaceAll('"','');
            const key=document.querySelector('div[class*="pagination-screen"]>span') .innerText.split('/')[0]+id+lang;
            const code=localStorage.getItem(key);
            switch(localStorage.global_lang){
                case '"golang"':
                    //buffer=("package main\\n\\n"+code.substring(1,code.length-1)).replace(/([^\s-]) ([^\s-])/gm,'$1+$2');
                    table = {'%20':'+','%5Cn':'%0A','%5Ct':'++++','%5C%22':'%22'};
                    buffer=encodeURIComponent("package main\\n\\n"+code.substring(1,code.length-1)).replace(/%20|%5Cn|%5Ct|%5C%22/g, key=>table[key]);
                    console.log(buffer);
                    buffer=await parse_data(buffer);
    
                    if(buffer.Error==0){
                        localStorage.setItem(key,buffer.Body.substring(14));
                        location.reload();
                    }else{
                        alert(
                            buffer.Error.replace(/(\.go:)(\d+)(:)/g, function($0, $1, $2, $3) {
                                return $1+(parseInt($2)-2)+$3;
                            })
                        );
                    }
    
                    break;
            }
        }
    
        const get_api_url=()=>{
            return "https://go.dev/_/fmt?backend=";
        }
    
        const parse_data=data=>{
            return new Promise(resolve=>{
                GM_xmlhttpRequest({
                    method: "POST",
                    url: get_api_url(),
                    headers: {
                        "Content-type":"application/x-www-form-urlencoded; charset=UTF-8",
                        "Accept-Encoding":"gzip, deflate, br",
                        "Origin":"https://go.dev",
                        "Referer":"https://go.dev/play/",
                        "Sec-Fetch-Dest":"empty",
                        "Sec-Fetch-Mode":"cors",
                        "Sec-Fetch-Site":"same-origin",
                    },
                    data:'body='+data,
                    onload: function(response) {
                        if (response.status >= 200 && response.status < 400) {
                            resolve(JSON.parse(response.responseText));
                        } else{
                            throw response;
                        }
                    }
                });
            });
        }
    
        //https://stackoverflow.com/a/46428962
        let oldHref = document.location.href;
        let bodyList = document.querySelector("body");
        let urlObserver = new MutationObserver((mutations)=> {
            mutations.forEach((mutation)=> {
                if (oldHref != document.location.href) {
                    oldHref = document.location.href;
                    clearInterval(timer);
                    init();
                }
            });
        });
        urlObserver.observe(bodyList, {
            childList: true,
            subtree: true
        });
    
        init();
    })();