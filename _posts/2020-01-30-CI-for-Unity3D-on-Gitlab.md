---
layout: post
author: Tom
title: CI for Unity3D on GitLab
cover: '/assets/images/UnityGitlabCI.png'
tags: 
    - name: 'Programming'
      icon: 'fas fa-code'
---
## Overview
During the development of our VR app Brain Visualizer, we wanted a method of automating the testing, building and eventually deployment of the app. With some research, we found that one of the best development practices to achieve this was Continuous Integration.

### What is Continuous Integration?
Continuous Integration (CI) is a process that uses a series of stages, also referred to as a pipeline, that contain commands to complete tasks such as testing, building, and deployment. Using a CI pipeline is useful for testing code that has been committed to a repository as part of a branch or merge request to check that the code doesn't break the main codebase.

### What is GitLab?
GitLab is a free, open-source project with the core goal to assist development teams collaborating on software projects, providing helpful tools for every stage of the development lifecycle. CI is built into the GitLab framework and allows developers and software teams to easily implement well-defined processes for compiling, testing and building their applications in a short time, whilst ensuring code quality.

## The CI Pipeline
The pipeline can be broken into three separate stages.
 + Activation
 + Test
 + Build

GitLab supports the use of Docker Images in it CI process to spin up a container built for a specific task. These images use a series of commands to configure and build an environment.

Gableroux provides a [GitLab repository](https://gitlab.com/gableroux/unity3d) that describes a way of using docker images and GitLab-CI to test and build unity projects for different platforms, as well associated docker images on [Docker Hub](https://hub.docker.com/r/gableroux/unity3d/tags).

#### Testing Stage

```yml
.test: &test
  stage: test
  <<: *unity_before_script
  <<: *cache
  script:
  - chmod +x ./ci/test.sh && ./ci/test.sh
  after_script:
    - *test_conversion
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

#### Build Stage

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

### Converting from NUnit to JUnit
GitLab's CI process is able to read and understand tests written with JUnit, a unit test library for Java. This makes life easier by telling you if any of the changes made has broken code by comparing the current tests against the previous tests, or tests run on master if it's part of a merge request. However, Unity runs it's tests using NUnit, a unit testing library designed for .Net languages.

As both Junit and Nunit output XML files, command line programs such as `xsltproc` and `saxonb-xslt` can be used to convert from one XML file in to another by supplying an XSLT to translate between them. For example, converting from NUnit3 to JUnit requires a XSLT file, for example `Nunit3-junit.xslt` which can be found on the [nunit transforms GitHub repository](https://github.com/nunit/nunit-transforms), to translate from NUnit3 formatting used by Unity to JUnit formatting understood by GitLab.

As commands such as `saxonb-xslt` are not installed in the Docker Images provided by Gableroux, a [custom image](https://hub.docker.com/r/twday/unity3d/tags) was created based on Gableroux's with the addition of the `libsaxonb-java` library installed to enable the conversion. 

An `after-script` can be added and the conversion command can be run after the main tests have been run.

```yml
.test_conversion: &test_conversion
  - saxonb-xslt -s $(pwd)/$TEST_PLATFORM-results.xml -xsl ./ci/nunit3-junit.xslt -o $(pwd)/$TEST_PLATFORM-results-converted.xml
```

## Summary

A full version of the `.gitlab-ci.yml` file for testing and building a Unity project for the android platform is available [here](https://gist.github.com/twday/1f47d9bb4157bcdbd608e4f7bd11ea58)