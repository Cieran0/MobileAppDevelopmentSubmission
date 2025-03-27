
# Workout Tracker Setup Guide

This README will guide you through the steps to set up both the backend and frontend of the Workout Tracker application using Docker, as well as configuring NGROK for tunneling.

## Prerequisites

Before you begin, you will need the following:

1. **Docker** - Ensure that Docker is installed and running on your system. You can get it from [here](https://www.docker.com/get-started).
2. **NGROK Token** - You need an NGROK token to create secure tunnels. You can sign up for NGROK and obtain a token from [NGROK's website](https://ngrok.com/).

## Steps to Run the Backend and Frontend

### 1. Set Up the Backend

First, navigate to the **backend** directory and build the Docker image:

```bash
cd backend
docker build -t workout-tracker .
```

Now, run the Docker container with the NGROK token:

```bash
docker run -e NGROK_TOKEN=[YOUR_NGROK_TOKEN] -p 25561:25561 -p 4040:4040 workout-tracker
```

Replace `[YOUR_NGROK_TOKEN]` with your NGROK token (this is required for tunneling the backend).

### 2. Set Up the Frontend

Next, in another terminal window, navigate to the **frontend** directory and build the Docker image:

```bash
cd frontend
docker build -t expo-client .
```

Once built, run the frontend container with the appropriate NGROK URL:

```bash
docker run -e API_URL="NGROK_URL" -p 19000:19000 -p 19001:19001 -p 19002:19002 -p 19006:19006 -p 8081:8081 expo-client
```

Replace `"NGROK_URL"` with the URL provided by NGROK after tunneling the backend. This URL will allow the frontend to communicate with the backend through the secure tunnel.

### 3. Get Your NGROK Token

To get your NGROK token, follow these steps:

1. Sign up for an account at [NGROK](https://ngrok.com/).
2. After logging in, navigate to the **Auth** section of your NGROK dashboard.
3. Copy the token provided and replace `[YOUR_NGROK_TOKEN]` in the backend run command.

## Summary

- **Backend**: Run the backend in Docker with the NGROK token.
- **Frontend**: Run the frontend in Docker, passing the NGROK URL for the backend.

Now, your Workout Tracker app should be up and running, with both the backend and frontend containers interacting through the NGROK tunnel.