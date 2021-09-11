if [ "$NETLIFY" == true ]
then
    echo "Running remote install!"
    mkdir ~/.ssh/
    echo "${SSH_PRIVATE_KEY}" > ~/.ssh/id_rsa
    chmod 600 ~/.ssh/id_rsa
    ssh-keyscan -t rsa github.com > ~/.ssh/known_hosts
else
    echo "Running local install!"
fi
