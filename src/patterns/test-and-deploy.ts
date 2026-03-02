/**
 * @flowWeaver pattern
 * @name test-and-deploy
 * @description Standard CI pipeline: checkout, setup, install, test, build, deploy
 *
 * @node co checkout [job: "test"]
 * @node setup setup-node [job: "test"]
 * @node install npm-install [job: "test"]
 * @node test npm-test [job: "test"]
 * @node build npm-build [job: "build"]
 * @node deploy deploy-ssh [job: "deploy"]
 *
 * @path IN -> co -> setup -> install -> test -> build -> deploy -> OUT
 */
