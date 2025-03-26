FROM alpine:latest

EXPOSE 80

RUN apk update && apk add apache2

RUN wget https://github.com/GPS4PETS/opencellid/archive/refs/tags/main.tar.gz \
 && tar -xvf main.tar.gz \
 && mv opencellid-main/web/data/* /var/www/localhost/htdocs/. \
 && rm main.tar.gz \
 && rm -rf opencellid-main 

CMD ["httpd", "-DFOREGROUND"]
