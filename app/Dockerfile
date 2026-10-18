# Use the official Node.js image as the base image
FROM node:24 AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY ./src/package*.json ./

# Install the application dependencies
RUN npm ci --ignore-scripts

# Copy the rest of the application files
COPY ./src .

# Build the NestJS application
RUN npm run build

# # Production Stage
FROM node:24-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package*.json /app
RUN mkdir /app/resources

RUN npm ci --omit=dev --ignore-scripts

# Expose the application port
EXPOSE 3000

USER node
# Command to run the application
CMD ["node", "dist/main"]