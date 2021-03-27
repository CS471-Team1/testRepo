#!/bin/bash
# Set environmental variables GITUSER and GITTOKEN before running
# GITTOKEN is set to personal access token value:
# Top right drop down > Settings > Developer settings > Personal access tokens > Generate new token

# GET /repos/{owner}/{repos}
# Gets repo information with headers - first header is HTTP response (200 expected)
curl -i -u $GITUSER:$GITTOKEN https://api.github.com/repos/sam-acker/bot-test-repo