// ==UserScript==
// @name         Coursera Transcript Auto-Scrolling
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Make Coursera transcript scrollbar always scroll to where the sentence is being said.
// @author       Pei
// @match        https://*coursera.org/learn/*
// @icon         https://www.google.com/s2/favicons?domain=coursera.org
// @grant        none
// ==/UserScript==

(function () {
        'use strict';

        const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                        if (mutation.attributeName === "class") {
                                scroll_transcript();
                        }
                });
        });

        const scroll_transcript = () => {
                let active_sentence = document.querySelector('.rc-Phrase.active');
                observer.observe(active_sentence, {
                        attributes: true
                });

                let topPos = active_sentence.offsetTop;
                document.getElementsByClassName('rc-VideoHighlightingManager')[0].scrollTop = topPos;
        }

        const init = () => {
                let timer = (
                        setInterval(() => {
                                let active_sentence = document.querySelector('.rc-Phrase.active');
                                if (active_sentence) {
                                        clearInterval(timer);

                                        observer.observe(active_sentence, {
                                                attributes: true //configure it to listen to attribute changes
                                        });

                                        Array.from(document.getElementsByClassName("rc-Phrase")).forEach((phrase) => {
                                                phrase.addEventListener("click", (e) => {
                                                        if (!e.altKey) {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                        }
                                                })
                                        });
                                }
                        }, 1000)
                );
        }

        //https://stackoverflow.com/a/46428962
        let oldHref = document.location.href;
        let bodyList = document.querySelector("body");
        let urlObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                        if (oldHref != document.location.href) {
                                oldHref = document.location.href;
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