---
layout: post
author: Tom
title: CI for Unity3D on GitLab
cover: '/assets/images/UnityGitlabCI.png'
tags: 
  - 'programming'
---
# Overview
During the development of our VR app Brain Visualizer, we wanted a method of automating the testing, building and eventually deployment of the app. With some research, we found that one of the best development practices to achieve this was Continuous Integration and as our app was already on GitLab, we decided that using GitLab's CI system was our best choice.

## What is Continuous Integration?
Continuous Integration (CI) is a process that uses a series of stages, collectively known as a pipeline, that contain commands to complete a sequence of tasks such as testing, building, and deployment. Using a CI pipeline can be extremely useful and save time during development as it can be used to automate the testing of the application code and building of the application.

## What is GitLab?
GitLab is a free, open-source project with the core goal to assist development teams collaborating on software projects, providing helpful tools for every stage of the development lifecycle. CI is built into the GitLab framework and allows developers and software teams to easily implement well-defined processes for compiling, testing and building their applications in a short time, whilst ensuring code quality.

# The CI Pipeline
The pipeline can be broken into three separate stages.
 + Activation
 + Test
 + Build

GitLab supports the use of Docker Images in it CI process to spin up a container built for a specific task. These images use a series of commands to configure and build an environment.

Gableroux provides a [GitLab repository](https://gitlab.com/gableroux/unity3d-gitlab-ci-example) that describes a way of using docker images and GitLab-CI to test and build unity projects for different platforms, as well associated docker images on [Docker Hub](https://hub.docker.com/r/gableroux/unity3d/tags). Most of the information provided in this post has come from the documents and issues provided in the repo.

## Activation
For our pipeline to be able to open a project in a unity context and run whatever we pass to it, we need to use an activated unity instance. We can run unity in Docker but as it is brand new every time a new instance is created, Unity isn't activated by default.

This snippet defines a job that queries the Unity Licensing servers using information from the docker image and retrieves a `.alf` file. The job is run manually from the GitLab UI as part of a pre-stage of the pipeline, as defined by `when: manual` and `stage: .pre`. The main part is the `get_activation_file.sh` script from Gableroux's documentation that contacts the unity licensing servers and creates the `.alf` file that is saved as an artefact for download. The file expires after 10 minutes after being created (`expire_in: 10 min`) as it is only needed to get the actual license.

```yml
get-activation-file:
  when: manual
  stage: .pre
  script:
    - chmod +x ./ci/get_activation_file.sh && ./ci/get_activation_file.sh
  artifacts:
    paths:
      - $UNITY_ACTIVATION_FILE
    expire_in: 10 min
  only:
  - master
```

Using the `.alf` file and following the instructions in the job log provided by Unity and visiting the [Unity licensing portal](https://license.unity.com/manual) will give you a `.ulf` file. This file is the license need to activate Unity within the pipeline. It's contents can be placed in a CI variable called `UNITY_LICENSE_CONTENT` which can then be used in the CI pipeline.

## Testing Stage

The Test stage is run when a merge request is made, as well as on the master branch. This ensures that any code changes made are tested before they are merged in to the main code.

```yml
.test: &test
  stage: test
  <<: *unity_before_script
  <<: *cache
  script:
  - chmod +x ./ci/test.sh && ./ci/test.sh
  artifacts:
    paths:
    - $(pwd)/$TEST_PLATFORM-results.xml
    - $(pwd)/$TEST_PLATFORM-results-converted.xml
    reports:
      junit: $(pwd)/$TEST_PLATFORM-results-converted.xml
  only:
  - merge_request
  - master
```

Unity creates a test results XML file that can be uploaded as an artefact. This tells us the tests that have been run, which ones passed and which failed. However, it is formatted using NUnit3 formatting which is not very useful to GitLab. For us to see it in the GitLab UI, it needs to be converted to something GitLab CI can read. 

### Converting from NUnit to JUnit
As mentioned before, GitLab's CI process cannot parse nunit formatted XML documents whereas It is able to read and understand tests written with JUnit, a unit test library for Java.

As both junit and nunit output XML files, it is possible to easily convert a nunit file to a JUnit file without too much hassle using a `.XSLT` file (Extensible Stylesheet Language Transformations). These files are designed to be used to convert XML-based documents from one structure to another.

There are command line programs such as `saxonb-xslt` that can be used to convert from files using a XSLT file. There are translation files available designed for converting between different formats, like [`Nunit3-junit.xslt`](https://github.com/nunit/nunit-transforms) which translates between nunit3 and nunit, creating a test output file understood by GitLab CI.

This is an example of using `saxonb-xslt` to translate from the nunit3 XML file to a junit XML file.
```sh
saxonb-xslt -s:$(pwd)/$TEST_PLATFORM-results.xml -xsl:./ci/nunit3-junit.xslt -o:$(pwd)/$TEST_PLATFORM-results-converted.xml
```

As commands such as `saxonb-xslt` are not installed in the GNU/Linux by default, a [custom image](https://hub.docker.com/r/twday/unity3d/tags) was created based on Gableroux's with the addition of the `libsaxonb-java` library installed to enable the conversion. This command can then be added to the end of the `test.sh` file to convert the XML files after the tests have been run.

## Build Stage

The build stage here is only run on the master branch to reduce the pipelines created and time used.

```yml
.build: &build
  stage: build
  <<: *unity_before_script
  <<: *cache
  script:
  - chmod +x ./ci/build.sh && ./ci/build.sh
  artifacts:
    paths:
    - ./Builds/
  only:
  - master

build-android:
  <<: *build
  variables:
    BUILD_TARGET: Android
```

Once the project has been built, the final files are uploaded as an artefact that can be downloaded or used later as part of a deployment stage.

# Summary

Using CI to test and build Unity projects is extremely useful  as it can help to test and build the project without tying up resources on your local machine leaving you to continue working on the project, fixing issues and develop new features.

The ability to view the tests from within the GitLab UI also helps because it lets you see what has passed or failed without having to look at the log for the job that failed.

A full version of the `.gitlab-ci.yml` file for testing and building a Unity project for the android platform is available [here](https://gist.github.com/twday/1f47d9bb4157bcdbd608e4f7bd11ea58)