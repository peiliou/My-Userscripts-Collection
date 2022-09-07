# Steam-Market-Sniper
## Description

A Steam market web bot that dynamically places/relists order to minimize order cost while maximizing order priority

## Features

* Monitoring support for multiple items
* Periodically scan listed items for price changes and relist orders accordingly
* Avoid malicious bidding from other users
        * The user sets an order price limit for each item (will continue to monitor the item until its price falls below the limit)
        * Automatically falls back to place an order that is slightly above the second highest order if a high bidding is canceled

## Usage

* Modify/Add item name in the beginning of the userscript code to match items to be monitored that are placed on https://steamcommunity.com/market
* Modify/Add price limit immediately followed by the item (this is the maximum order price you are willing to place for the item)
* Go to https://steamcommunity.com, and leave the tab open (you may want to make a separate window specifically for this tab)
* [Optional] Open developer console to view userscript logs

## Last updated

9/30/2020