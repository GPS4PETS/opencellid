FROM alpine:latest

EXPOSE 80

RUN apk update && apk add apache2

RUN echo "V1.0"

WORKDIR /var/www/localhost/htdocs

ADD https://github.com/GPS4PETS/opencellid/archive/refs/tags/main.tar.gz main.tar.gz
RUN tar -xvf main.tar.gz \
 && mv opencellid-main/web/data/* /var/www/localhost/htdocs/. \
 && rm main.tar.gz \
 && rm -rf opencellid-main 

CMD ["httpd", "-DFOREGROUND"]
