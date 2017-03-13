FROM ubuntu:precise

# Browser install from sitespeedio/docker-browsers

ENV LC_ALL C
ENV DEBIAN_FRONTEND noninteractive
ENV DEBCONF_NONINTERACTIVE_SEEN true

ENV FIREFOX_VERSION 45.7*
ENV CHROME_VERSION 56.0.*

# Avoid ERROR: invoke-rc.d: policy-rc.d denied execution of start.
# Avoid ERROR: invoke-rc.d: unknown initscript, /etc/init.d/systemd-logind not found.

RUN echo "#!/bin/sh\nexit 0" > /usr/sbin/policy-rc.d && \
    touch /etc/init.d/systemd-logind

# Adding sudo for SLTC, lets see if we can find a better place (needed in Ubuntu 16)

RUN apt-get update && \
    apt-get install -y \
    ca-certificates \
    libgl1-mesa-dri \
    xfonts-100dpi \
    xfonts-75dpi \
    xfonts-scalable \
    dbus-x11 \
    libdbus-glib-1-2 \
    libx11-xcb-dev \
    wget \
    bzip2 \
    curl \
    git \
    libgtk-3-0 \
    xvfb

RUN curl -sL https://deb.nodesource.com/setup_6.x | bash - && \
    apt-get install -y nodejs

RUN wget -O firefox.tar.bz "https://download.mozilla.org/?product=firefox-52.0-SSL&os=linux64&lang=en-US" && \
    bunzip2 firefox.tar.bz && \
    tar -xvf firefox.tar

ENV PATH="$PWD/firefox:$PATH"

ADD ./start.sh /bin/xvfb_wrap
RUN chmod +x /bin/xvfb_wrap

WORKDIR /usr/src/app

ADD ./package.json ./package.json
RUN npm install
ADD ./ ./

RUN /bin/xvfb_wrap npm run test-browser
