var childProcess = require('child_process');

describe("pivotal-gemfire", function() {
  var gemfire;

  beforeEach(function() {
    gemfire = require("../gemfire.js");
    gemfire.clear();
  });

  afterEach(function(done) {
    setTimeout(done, 0);
  });

  describe(".version", function() {
    it("returns the version string", function() {
      expect(gemfire.version()).toEqual("7.0.2.0");
    });
  });

  describe(".put/.get", function() {
    it("returns undefined for unknown keys", function() {
      expect(gemfire.get('foo')).toBeUndefined();
    });

    it("stores and retrieves objects", function() {
      expect(gemfire.put("foo", { foo: "bar" })).toEqual({ foo: "bar" });
      expect(gemfire.get("foo")).toEqual({ foo: "bar" });
    });

    it("stores and retrieves strings", function() {
      expect(gemfire.put("foo", "bar")).toEqual("bar");
      expect(gemfire.get("foo")).toEqual("bar");
    });

    it("stores and retrieves null", function() {
      expect(gemfire.put("foo", null)).toBeNull();
      expect(gemfire.get("foo")).toBeNull();
    });
  });

  describe(".onPut", function() {
    describe("for puts triggered locally", function() {
      afterEach(function() {
        gemfire.unregisterAllKeys();
      });

      var key = Date.now().toString();

      var callback1 = jasmine.createSpy();
      var callback2 = jasmine.createSpy();

      beforeEach(function(done) {
        gemfire.registerAllKeys();
        gemfire.onPut(callback1);
        gemfire.onPut(callback2);
        setTimeout(done, 0);
      });

      beforeEach(function() {
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
      });

      beforeEach(function(done) {
        gemfire.put(key, "bar");
        setTimeout(done, 0);
      });

      beforeEach(function() {
        expect(callback1).toHaveBeenCalledWith(key, "bar");
        expect(callback2).toHaveBeenCalledWith(key, "bar");
      });

      beforeEach(function(done) {
        gemfire.put(key, "baz");
        setTimeout(done, 0);
      });

      it("fires the callback function when a put occurs", function() {
        expect(callback1).toHaveBeenCalledWith(key, "baz");
        expect(callback2).toHaveBeenCalledWith(key, "baz");
      });
    });

    describe("for puts triggered externally", function() {
      var callback;

      function triggerExternalPut(done){
        childProcess.execFile("node", ["spec/support/external_put.js"], function(error, stdout, stderr) {
          if(error) {
            console.error(stderr);
            expect(error).toBeNull();
            done();
          }
        });

        setTimeout(done, 500);
      }

      function setUpCallback(done){
        callback = jasmine.createSpy("callback").andCallFake(function(key, value){
          done();
        });

        gemfire.onPut(callback);
      }

      describe("when interest in the key has been registered", function() {
        beforeEach(function(done) {
          gemfire.registerAllKeys();
          setUpCallback(done);
          triggerExternalPut(done);
        });

        it("fires the callback function", function() {
          expect(callback).toHaveBeenCalledWith("async", "test");
        });
      });

      describe("when interest in the key has not been registered", function() {
        beforeEach(function(done) {
          gemfire.unregisterAllKeys();
          setUpCallback(done);
          triggerExternalPut(done);
        });

        it("does not call the callback function", function() {
          expect(callback).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe("executeQuery", function () {
    it("executes a query that can retrieve string results", function() {
      gemfire.put("string1", "a string");
      gemfire.put("string2", "another string");
      gemfire.put("string3", "a string");

      var query = "SELECT DISTINCT * FROM /exampleRegion";

      var results = gemfire.executeQuery(query);

      expect(results.length).toEqual(2);

      expect(results).toContain("a string");
      expect(results).toContain("another string");
    });

    it("executes a query with an OQL predicate", function() {
      gemfire.put("string1", "a string");
      gemfire.put("string2", "another string");

      var query = "SELECT entry.value FROM /exampleRegion.entries entry WHERE entry.key = 'string2'";

      var results = gemfire.executeQuery(query);

      expect(results.length).toEqual(1);

      expect(results).toContain("another string");
    });

    xit("executes a query that can retrieve results of all types", function() {
      gemfire.put("a string", "a string");
      gemfire.put("an object", {"an": "object"});

      var query = "SELECT DISTINCT * FROM /exampleRegion";

      var results = gemfire.executeQuery(query);

      expect(results.length).toEqual(2);

      expect(results).toContain({"an": "object"});
      expect(results).toContain("a string");
    });
  });

  describe("cleanup", function(){
    it("is not actually a test", function(){
      gemfire.close();
    });
  });
});
