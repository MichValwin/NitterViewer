# Nitter Viewer

This project is in a very early state, bugs are expected.

# Info
This program downloads all tweets (of the first page) and images of all users on the list `nitterList.json`.
So you can view all the the tweets from the list when you want without needing an account.

# Build and config
## Build instructions
 - Install packages for vue frontend.
 - Go to frontend directory and do `npm install`, then build it with `npm run build`
 - Install libraries in main directory with `npm install`
## Config project
 - Change config file in /src/config.js as you want. You probably want to disable SOCKS_PROXY (leave it as '')
 - Rename NitterList.example.json to NitterList.json and edit it as you like
 - Run the project with `npm run`, then it will prompt you to use a password

# TODO list
 - [ ] Download videos from data-url
 - [ ] Implement infinte scroll