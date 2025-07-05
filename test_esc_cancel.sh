#!/bin/bash

echo "Testing ESC cancellation fix..."
echo "This script will run for 60 seconds unless you cancel it with ESC"
echo "Press ESC at any time to test the cancellation"
echo ""

for i in {1..60}; do
    echo "Running for $i seconds..."
    sleep 1
done

echo "Script completed without cancellation"