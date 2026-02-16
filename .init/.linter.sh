#!/bin/bash
cd /home/kavia/workspace/code-generation/organizepro-task-manager-321079-321090/task_management_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

