# Nitter Viewer

This project is in a very early state, bugs are expected.

# Info
This program downloads all tweets (of the first page) and images of all users on the list `nitterList.json`.
So you can view all the the tweets from the list when you want without needing an account.
Although Nitter is private, I recommend to setup a Tor SOCKS proxy and connect it.

# Build and config
## Build instructions
 - Requires NodeJS >= 16.
 - Download/clone repository.
 - Install packages for vue frontend. Go to *./frontend/* directory and do `npm install`, then build it with `npm run build`.
 - Install libraries in main directory with `npm install`.
## Config project
 - Change config file in */src/config.js* as you want. You probably want to disable SOCKS_PROXY (leave it as '').
 - Rename NitterList.example.json to NitterList.json and edit it as you like.
 - Run the project with `npm run start`, then it will prompt you to choose a password.
 - Connect to it through the port written in */src/config.js*. Default is 8020.

# TODO list
 - [ ] Download videos from data-url
 - [ ] Implement infinte scroll
