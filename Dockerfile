FROM node:16

# Set ENV var
ARG GITHUB_USERNAME=${GITHUB_USERNAME}
ARG GITHUB_EMAIL=${GITHUB_EMAIL}
ARG SSH_PRIVATE_KEY=${SSH_PRIVATE_KEY}

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
COPY yarn.lock ./
COPY preinstall.sh ./

# SSH 
RUN git config --global user.name "$GITHUB_USERNAME"
RUN git config --global user.email "$GITHUB_EMAIL"
RUN mkdir ~/.ssh/
RUN echo "${SSH_PRIVATE_KEY}" >> ~/.ssh/id_rsa
RUN chmod 600 ~/.ssh/id_rsa
RUN ssh-keyscan -t rsa github.com > ~/.ssh/known_hosts

RUN yarn

# Copy directory
COPY . .

# Run server
EXPOSE 3000
CMD ["yarn","start"]