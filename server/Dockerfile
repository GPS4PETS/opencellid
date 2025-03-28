FROM alpine:latest

EXPOSE 5265

RUN apk update && apk add sqlite sqlite-dev openssh gcc musl-dev curl npm nodejs

WORKDIR /opt/opencellid
RUN echo "V1.1"

RUN wget -O extension-functions.c https://www.sqlite.org/contrib/download/extension-functions.c?get=25 \ 
 && gcc -fPIC -lm -shared extension-functions.c -o libsqlitefunctions.so

ADD https://github.com/GPS4PETS/opencellid/archive/refs/tags/main.tar.gz main.tar.gz
RUN tar -xvf main.tar.gz \
 && mv opencellid-main/server/data/* /opt/opencellid/. \
 && rm main.tar.gz \
 && rm -rf opencellid-main 

RUN npm install

CMD ["cat /opt/opencellid/schema.sql | sqlite3 /opt/opencellid/sqlite/oci_cells.sqlite"]

RUN echo "15      0       *       *       *       /opt/opencellid/./update-db.sh" >> /etc/crontabs/root
RUN touch /etc/crontabs/cron.update
CMD ["crond", "-b"]

#CMD ["tail", "-f", "/dev/null"]
CMD ["/usr/bin/env", "node", "cell-geolocation.js"]
