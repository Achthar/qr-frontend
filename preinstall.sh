if [ "$NETLIFY" == true ]
then
    echo "Running remote install!"
    echo $GITHUB_USERNAME
    echo $GITHUB_EMAIL
    git config --global user.name "$GITHUB_USERNAME"
    git config --global user.email "$GITHUB_EMAIL"
    mkdir ~/.ssh/
    echo "-----BEGIN OPENSSH PRIVATE KEY-----" >> ~/.ssh/id_rsa
    echo "${SSH_PRIVATE_KEY}" >> ~/.ssh/id_rsa
    echo "-----END OPENSSH PRIVATE KEY-----" >> ~/.ssh/id_rsa
    chmod 600 ~/.ssh/id_rsa
    ssh-keyscan -t rsa github.com > ~/.ssh/known_hosts
else
    echo "Running local install!"
fi
