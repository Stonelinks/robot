FROM resin/armhf-alpine:3.4

# Defines our working directory in container
WORKDIR /usr/src/app

# Copies the package.json first for better cache on later pushes
COPY package.json package.json

# This will copy all files in our root to the working directory in the container
COPY . ./

RUN apk add --update \
    ffmpeg \
    gcc \
    g++ \
    nodejs \
    make \
    musl-dev

RUN JOBS=MAX npm install --production --unsafe-perms 


#  && npm cache clean \
#  && rm -rf /tmp/* \
#  && apk del gcc g++ make musl-dev \
#  && rm -rf /var/cache/apk/*

RUN npm run build:client


CMD ["npm", "run", "start"]
