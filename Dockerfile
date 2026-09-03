FROM aquasec/trivy:0.71.1@sha256:53570e6911c2361ebe7995228088cf83a6b9b73e7f3cdca44bd8f8f425e80fa7  AS scanner

# Copy yarn.lock to run SBOM scan
COPY yarn.lock /tmp
RUN trivy fs --format spdx-json --scanners "license" /tmp/yarn.lock > /tmp/sbom.spdx.json

FROM ghcr.io/nordeck/matrix-widget-toolkit/widget-server:1.2.3@sha256:1cb5845a60176e8146a2fe8acde028a5a726f13bc3d4963feccfa581cc9ba62f

ADD --chown=nginx:nginx build /usr/share/nginx/html/
ADD --chown=nginx:nginx LICENSE /usr/share/nginx/html/LICENSE.txt

# Add SBOM to the public folder
COPY --from=scanner --chown=nginx:nginx /tmp/sbom.spdx.json /usr/share/nginx/html/sbom.spdx.json

# Allow hashes for @carbon/charts.
# The library sets style="text-anchor: end;" at a SVG element when we close the modal that hosts the chart.
ENV CSP_STYLE_SRC="${CSP_STYLE_SRC} 'sha256-Iga7e6saiujlA0I0tma/RscQvHqQgY3nuYvqRYMCDF8=' 'unsafe-hashes'"

# Allow loading images from the home server.
ENV CSP_IMG_SRC="\${REACT_APP_HOME_SERVER_URL}"
