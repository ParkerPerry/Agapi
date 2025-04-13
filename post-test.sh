#!/bin/bash
# Post-test script to generate API trace reports
echo "Generating API trace report..."
node generate-api-trace-report.cjs
echo "API trace report generated successfully!"