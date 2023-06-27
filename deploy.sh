#!/bin/bash

# Stop and remove the existing container
if sudo docker container inspect final >/dev/null 2>&1; then
  sudo docker stop final
fi
sudo docker rm final || true
sudo docker rmi final || true

# Remove all unused data
sudo docker system prune --force

# Pull the latest changes from git repository
git pull

# Build a new Docker image
sudo docker build -t final .

# Recreate the container
sudo docker run --name final -d -p 80:3300 -it final

# Wait for the server to start
sleep 5

# Display the container logs
sudo docker logs final
