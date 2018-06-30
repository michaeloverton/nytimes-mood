module.exports = {
    apps: [{
      name: 'nytimes-mood',
      script: './index.js'
    }],
    deploy: {
      production: {
        user: 'ubuntu',
        host: 'ec2-54-245-0-77.us-west-2.compute.amazonaws.com',
        key: '~/.ssh/mood-node-api.pem',
        ref: 'origin/master',
        repo: 'git@github.com:michaeloverton/nytimes-mood.git',
        path: '/home/ubuntu/nytimes-mood',
        'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js'
      }
    }
  }