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
// @connect      formatter.org
// ==/UserScript==

(function() {
        'use strict';
        let timer,id,lang;
        localStorage.global_lang='"python3"';
    
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
            const key=document.querySelector('div[class*="pagination-screen"]>span') .innerText.split('/')[0]+id;
            const code=localStorage.getItem(key+lang);
            const current_lang=localStorage.getItem(key+'lang')||localStorage.global_lang;
    
            switch(current_lang){
                case '"golang"':
                    table = {'%20':'+','%5Cn':'%0A','%5Ct':'++++','%5C%22':'%22'};
                    buffer=encodeURIComponent("package main\\n\\n"+code.substring(1,code.length-1)).replace(/%20|%5Cn|%5Ct|%5C%22/g, key=>table[key]);
                    buffer=await parse_data("https://go.dev/_/fmt?backend=",{"Origin":"https://go.dev","Referer":"https://go.dev/play/"},'body='+buffer);
    
                    if(buffer.Error==0){
                        localStorage.setItem(key+lang,buffer.Body.substring(14));
                        location.reload();
                    }else{
                        alert(
                            buffer.Error.replace(/(\.go:)(\d+)(:)/g, function($0, $1, $2, $3) {
                                return $1+(parseInt($2)-2)+$3;
                            })
                        );
                    }
    
                    break;
                case '"python3"':
                case '"python"':
                    table = {'\\n':'\n'};
                    buffer=code.substring(1,code.length-1).replace(/\\n/g, key=>table[key]);
                    buffer=await parse_data("https://formatter.org/admin/python-format",{"Origin":"https://formatter.org","Referer":"https://formatter.org/python-formatter"},JSON.stringify({"codeSrc":buffer}));
    
                    if(buffer.errcode==0){
                        localStorage.setItem(key+lang,buffer.codeDst);
                        location.reload();
                    }else{
                        alert(
                            buffer.codeDst
                        );
                    }
                    break;
                default:
    
                    break;
            }
        }
    
    
        const parse_data=(url,header,data)=>{
            return new Promise(resolve=>{
                GM_xmlhttpRequest({
                    method: "POST",
                    url: url,
                    headers: {
                        "Content-type":"application/x-www-form-urlencoded; charset=UTF-8",
                        "Accept-Encoding":"gzip, deflate, br",
                        "Sec-Fetch-Dest":"empty",
                        "Sec-Fetch-Mode":"cors",
                        "Sec-Fetch-Site":"same-origin",
                        ...header,
                    },
                    data:data,
                    onload: function(response) {
                        //console.log(response);
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