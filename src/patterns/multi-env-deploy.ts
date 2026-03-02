/**
 * @flowWeaver pattern
 * @name multi-env-deploy
 * @description Multi-environment deployment: test, deploy to staging, then production
 *
 * @node co checkout [job: "test"]
 * @node setup setup-node [job: "test"]
 * @node install npm-install [job: "test"]
 * @node test npm-test [job: "test"]
 * @node build npm-build [job: "build"]
 * @node deploystg deploy-ssh [job: "deploy-staging" environment: "staging"]
 * @node checkstg health-check [job: "deploy-staging"]
 * @node deployprod deploy-ssh [job: "deploy-production" environment: "production"]
 * @node checkprod health-check [job: "deploy-production"]
 *
 * @path IN -> co -> setup -> install -> test -> build -> deploystg -> checkstg -> deployprod -> checkprod -> OUT
 */
