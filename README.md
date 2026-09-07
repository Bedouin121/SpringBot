# Bedouin: Your Friendly Personal AI

Welcome to the Bedouin project! This is a simple, full-stack application that brings together a Spring Boot backend and a clean, responsive React interface. 

The goal here was to create a straightforward, powerful chatbot experience that you can easily run, customize, and make your own.

## What's Inside

We've kept the project structure nice and simple:

*   **`backend`**: The brains of the operation—built with Java, Spring Boot, and Spring AI. It handles the clever bits, using OpenAI to generate responses to your queries.
*   **`frontend`**: The face of the project—a modern, intuitive React interface where you'll interact with the chatbot.

## Running the App

The easiest way to get Bedouin up and running is with Docker. We've automated the setup so you don't have to worry about the nitty-gritty:

1.  **Build and Run**: Just run this in your terminal:
    ```bash
    docker-compose up --build
    ```

2.  **Access the App**: Once everything is ready, head to your browser:
    - **Frontend**: [http://localhost:3000](http://localhost:3000)
    - **Backend**: [http://localhost:8080](http://localhost:8080)

## Modifying Bedouin

We built this to be a playground for your ideas! Feel free to jump in and start customizing:
- Want to change the UI? Head over to the `frontend` folder and play with the React components or CSS.
- Need to adjust how the AI thinks or behaves? The logic lives in the `backend` folder.

Have fun building!
