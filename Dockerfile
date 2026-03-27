FROM aquasec/trivy:0.69.3@sha256:bcc376de8d77cfe086a917230e818dc9f8528e3c852f7b1aff648949b6258d1c  AS scanner

# Copy yarn.lock to run SBOM scan
COPY yarn.lock /tmp
RUN trivy fs --format spdx-json --scanners "license" /tmp/yarn.lock > /tmp/sbom.spdx.json

FROM ghcr.io/nordeck/matrix-widget-toolkit/widget-server:1.2.2@sha256:55aa10d9adfb5ff8f72de7017d18a7230843bd8b056573c08a2429ad463c5564

ADD --chown=nginx:nginx build /usr/share/nginx/html/
ADD --chown=nginx:nginx LICENSE /usr/share/nginx/html/LICENSE.txt

# Add SBOM to the public folder
COPY --from=scanner --chown=nginx:nginx /tmp/sbom.spdx.json /usr/share/nginx/html/sbom.spdx.json

# Allow hashes for @carbon/charts.
# The library sets style="text-anchor: end;" at a SVG element when we close the modal that hosts the chart.
ENV CSP_STYLE_SRC="${CSP_STYLE_SRC} 'sha256-Iga7e6saiujlA0I0tma/RscQvHqQgY3nuYvqRYMCDF8=' 'unsafe-hashes'"

# Allow loading images from the home server.
ENV CSP_IMG_SRC="\${REACT_APP_HOME_SERVER_URL}"
