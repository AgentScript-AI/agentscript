/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');

module.exports = {
    client: {
        service: {
            name: 'linear',
            url: 'https://api.linear.app/graphql',
        },
        includes: [path.join(__dirname, './src/**/*.gql')],
    },
};
