FROM node

ADD package.json package-lock.json /opt/webogram/
WORKDIR /opt/webogram

RUN npm install -g gulp && npm install

ADD . /opt/webogram

EXPOSE 8000

CMD ["gulp", "watch"]
