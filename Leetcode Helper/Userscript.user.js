// ==UserScript==
// @name         LeetCode Helper
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  try to take over the world!
// @author       Pei
// @match        https://leetcode.com/problems/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leetcode.com
// @grant        GM_xmlhttpRequest
// @connect      go.dev
// @connect      formatter.org
// ==/UserScript==

(function () {
	'use strict';
	let timer, id, lang, metadata;
	localStorage.global_lang = '"python3"';

	const init = () => {
		timer = (
			setInterval(() => {
				const elem = document.querySelector("." + CSS.escape("dark:text-dark-red-4"));
				const btns = document.querySelector("#editor").children[2].children[1].children[0].children;
				if (btns.length == 6) {
					for (let key in localStorage) {
						if (parseInt(key) > 0) {
							const tmp = key.split("_");
							id = "_" + tmp[1] + "_";
							metadata = __NEXT_DATA__.props.pageProps.dehydratedState.queries[0].state.data;
							break;
						}
					}
					console.log(id);

					const new_btn = document.createElement('button');
					new_btn.className = 'rounded px-3 py-1.5 font-medium items-center whitespace-nowrap transition-all focus:outline-none inline-flex hover:bg-fill-3 dark:hover:bg-dark-fill-3 ml-auto !p-1';
					new_btn.innerText = 'format';
					new_btn.onclick = format;
					btns[0].before(new_btn);
				}

				if (elem) {
					const key_word = "run";
					const submit_button = Array.from(document.querySelectorAll('button')).find(el => el.textContent.toLowerCase().includes(key_word));
					if (submit_button) {
						submit_button.click();
					}
				}
			}, 1000)
		);
	}

	const format = async () => {
		let buffer, table, lang = localStorage.global_lang;
		const key = metadata.question.questionId + id;
		let current_lang = localStorage.getItem(key + 'lang') || lang;
		current_lang = current_lang.replaceAll('"', '');
		const code = localStorage.getItem(key + current_lang);

		switch (current_lang) {
			case 'golang':
				table = { '%20': '+', '%5Cn': '%0A', '%5Ct': '++++', '%5C%22': '%22' };
				buffer = encodeURIComponent("package main\\n\\n" + code.substring(1, code.length - 1)).replace(/%20|%5Cn|%5Ct|%5C%22/g, key => table[key]);
				buffer = await parse_data("https://go.dev/_/fmt?backend=", { "Origin": "https://go.dev", "Referer": "https://go.dev/play/" }, 'body=' + buffer);

				if (buffer.Error == 0) {
					localStorage.setItem(key + current_lang, buffer.Body.substring(14));
					location.reload();
				} else {
					alert(
						buffer.Error.replace(/(\.go:)(\d+)(:)/g, function ($0, $1, $2, $3) {
							return $1 + (parseInt($2) - 2) + $3;
						})
					);
				}

				break;
			case 'python3':
			case 'python':
				table = { '\\n': '\n', '\\\"': '\"' };
				buffer = code.substring(1, code.length - 1).replace(/\\n|\\\"/g, key => table[key]);
				buffer = await parse_data("https://formatter.org/admin/python-format", { "Origin": "https://formatter.org", "Referer": "https://formatter.org/python-formatter" }, JSON.stringify({ "codeSrc": buffer }));

				if (buffer.errcode == 0) {
					if (buffer.codeDst.substring(0, 5) == 'error') {
						alert(
							buffer.codeDst
						);
					} else {
						localStorage.setItem(key + current_lang, buffer.codeDst);
						location.reload();
					}
				}
				break;
			default:

				break;
		}
	}


	const parse_data = (url, header, data) => {
		return new Promise(resolve => {
			GM_xmlhttpRequest({
				method: "POST",
				url: url,
				headers: {
					"Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
					"Accept-Encoding": "gzip, deflate, br",
					"Sec-Fetch-Dest": "empty",
					"Sec-Fetch-Mode": "cors",
					"Sec-Fetch-Site": "same-origin",
					...header,
				},
				data: data,
				onload: function (response) {
					//console.log(response);
					if (response.status >= 200 && response.status < 400) {
						resolve(JSON.parse(response.responseText));
					} else {
						throw response;
					}
				}
			});
		});
	}

	//https://stackoverflow.com/a/46428962
	let oldHref = document.location.href;
	let bodyList = document.querySelector("body");
	let urlObserver = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
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