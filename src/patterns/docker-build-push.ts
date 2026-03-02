/**
 * @flowWeaver pattern
 * @name docker-build-push
 * @description Docker pipeline: checkout, login, build image, push to registry
 *
 * @node co checkout [job: "docker"]
 * @node login docker-login [job: "docker"]
 * @node build docker-build [job: "docker"]
 * @node push docker-push [job: "docker"]
 *
 * @path IN -> co -> login -> build -> push -> OUT
 */
