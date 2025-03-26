FROM alpine:latest

EXPOSE 80

RUN apk update && apk add apache2

RUN wget https://github.com/GPS4PETS/opencellid-web/archive/refs/tags/main.tar.gz \
 && tar -xvf main.tar.gz \
 && mv opencellid-web-main/data/* /var/www/localhost/htdocs/. \
 && rm main.tar.gz \
 && rm -rf opencellid-web-main 

CMD ["httpd", "-DFOREGROUND"]
