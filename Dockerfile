FROM aquasec/trivy:0.76.2@sha256:8f6bb947dbc528902e11f2f5be52f7b519f6a39d5d148f41166f2040499768fb  AS scanner

# Copy yarn.lock to run SBOM scan
COPY yarn.lock /tmp
RUN trivy fs --format spdx-json --scanners "license" /tmp/yarn.lock > /tmp/sbom.spdx.json

FROM ghcr.io/nordeck/matrix-widget-toolkit/widget-server:1.2.4@sha256:77c23bd22699771e682dac9ec34e1a73c00728405bd77a160d2df22a7922800f

ADD --chown=nginx:nginx build /usr/share/nginx/html/
ADD --chown=nginx:nginx LICENSE /usr/share/nginx/html/LICENSE.txt

# Add SBOM to the public folder
COPY --from=scanner --chown=nginx:nginx /tmp/sbom.spdx.json /usr/share/nginx/html/sbom.spdx.json

# Allow hashes for @carbon/charts.
# The library sets style="text-anchor: end;" at a SVG element when we close the modal that hosts the chart.
ENV CSP_STYLE_SRC="${CSP_STYLE_SRC} 'sha256-Iga7e6saiujlA0I0tma/RscQvHqQgY3nuYvqRYMCDF8=' 'unsafe-hashes'"

# Allow loading images from the home server.
ENV CSP_IMG_SRC="\${REACT_APP_HOME_SERVER_URL}"
