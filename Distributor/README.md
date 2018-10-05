# Distributor Module

This module distributes a basic income in ERC-20-compliant KuwaCoins. It includes two main programs:

* server.js - Runs as an Applications Programming Interface (API). Listens for HTTP/HTTPS post requests that provide a Kuwa ID. Checks that the Kuwa registration info exists and that the ID has a "Valid" status. Registers the Kuwa ID for a basic income of one KuwaCoin per day. If the Kuwa ID has a zero KuwaCoin balance, this process will send one KuwaCoin to that address.  

* payer.js - Sends one KuwaCoin to each KuwaID that has registered for a basic income payment.


## Getting Started

IMPORTANT: The Distributor (and other TCUP modules) typically define sensitive configuration settings (passwords, etc.) in a private properties file (config_private.json). When you clone the repo, however, you should see files named config.json, which contain dummy settings. Rename or copy these files to config_private.json. Then edit those files to include the appropriate private information for your implementation.

To get started, please follow these instructions:

From the api subdirectory, run:

    npm install

To start server.js, run:

    npm start server.js 

    or

    forever start server.js

Typically, you would want to run the payer.js program once per day as a batch job (e.g., via crontab).  To execute payer.js from the command line, run:

    node payer.js   
