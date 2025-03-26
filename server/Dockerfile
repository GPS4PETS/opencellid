FROM alpine:latest

EXPOSE 5265

RUN apk update && apk add sqlite sqlite-dev openssh gcc musl-dev npm nodejs

WORKDIR /opt/opencellid

RUN wget -O extension-functions.c https://www.sqlite.org/contrib/download/extension-functions.c?get=25 
# && gcc -fPIC -lm -shared extension-functions.c -o libsqlitefunctions.so

RUN wget https://github.com/GPS4PETS/opencellid-server/archive/refs/tags/main.tar.gz \
 && tar -xvf main.tar.gz \
 && mv opencellid-server-main/data/* /opt/opencellid/. \
 && rm main.tar.gz \
 && rm -rf opencellid-server-main 

RUN npm install

#RUN rm /opt/opencellid/sqlite/oci_cells.sqlite
#RUN cat /opt/opencellid/schema.sql | sqlite3 /opt/opencellid/sqlite/oci_cells.sqlite

CMD ["tail", "-f", "/dev/null"]
#CMD ["/usr/bin/env", "node", "cell-geolocation.js"]
