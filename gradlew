#!/bin/bash

##############################################################################
##
##  Gradle start up script for UN*X
##
##############################################################################

# Attempt to set APP_HOME
# Resolve links: $0 may be a symlink
app_path="$0"

# Need this for daisy-chained symlinks.
while
    APP_HOME=${app_path%"${app_path##*/}"}
    [ -h "$app_path" ]
do
    app_path=$(readlink "$app_path")
done

APP_HOME=$(cd "${APP_HOME:-./}" && pwd -P) || exit

APP_NAME="Gradle"
APP_BASE_NAME=${0##*/}

exec "$JAVA_HOME"/bin/java -Xmx64m -Xms64m -classpath "$APP_HOME"/gradle/wrapper/gradle-wrapper.jar org.gradle.wrapper.GradleWrapperMain "$@"
