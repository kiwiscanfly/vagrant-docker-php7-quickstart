FROM alpine:3.6
LABEL Maintainer="Daryl Milne <hello@daryl.nz>" \
      Description="Lightweight container with Nginx 1.10 & PHP-FPM 7.1 based on Alpine Linux."

# Install packages from testing repo's
RUN apk --update --no-cache add \
    git \
    make \
    shadow \
    jpeg \
    libpng \
    libjpeg \
    libjpeg-turbo-dev \
    ghostscript \
    imagemagick \
    imagemagick-dev \
    php7 \
    php7-fpm \
    php7-mysqli \
    php7-pdo \
    php7-pdo_mysql \
    php7-json \
    php7-openssl \
    php7-curl \
    php7-zlib \
    php7-xml \
    php7-pear \
    php7-phar \
    php7-intl \
    php7-dom \
    php7-simplexml \
    php7-xmlreader \
    php7-ctype \
    php7-mbstring \
    php7-exif \
    php7-session \
    php7-gd \
    php7-imagick \
    freetype \
    nginx \
    --repository http://dl-cdn.alpinelinux.org/alpine/v3.6/main/ \
    --repository http://dl-cdn.alpinelinux.org/alpine/v3.6/community/

# Install packages from stable repo's
RUN apk --no-cache add supervisor curl

# Configure nginx
COPY config/nginx.conf /etc/nginx/nginx.conf

# Configure PHP-FPM
COPY config/fpm-pool.conf /etc/php7/php-fpm.d/zzz_custom.conf
COPY config/php.ini /etc/php7/conf.d/zzz_custom.ini

# Configure supervisord
COPY config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Add application
RUN mkdir -p /var/www/uploads && chown -R nginx:nginx /var/www/uploads
RUN mkdir -p /var/www/html
WORKDIR /var/www/html
#COPY src/ /var/www/html/

EXPOSE 80 443
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

RUN usermod -u 1000 nginx && chown -R nginx:nginx /var/www/uploads