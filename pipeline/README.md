# Task 2

![Pipeline Configs](/.github/workflows/)
![Scan Outputs](/evidence/)
![Security Gates Settings](/Quality%20Gate%20Settings%20GitHub.png)

## Example Scans

Example scans can be seen in the Actions tab.

### Sonar Results

![SonarQube](/evidence/sonar-cloud-dashboard.png)

## Security Gates

Security Gates prevent Pull Requests from being merged into releases if any of the scans fail. 

If any of the failures are false positives or an acceptable risk (e.g. opening up endpoints to 0.0.0.0/0 and allowing internet access for certain services), then they can be circumvented with direct approval of the Security Lead.

