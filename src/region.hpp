#ifndef __REGION_HPP__

#include <v8.h>
#include <nan.h>
#include <gfcpp/Region.hpp>
#include <node.h>
#include "cache.hpp"

using namespace v8;

namespace node_gemfire {

class Region : node::ObjectWrap {
 public:
    explicit Region(Handle<Object> cacheHandle, gemfire::RegionPtr regionPtr) : regionPtr(regionPtr) {
      NanAssignPersistent(this->cacheHandle, cacheHandle);
    }
    ~Region();
    static void Init(Handle<Object> exports);
    static NAN_METHOD(GetRegion);
    static NAN_METHOD(New);
    static NAN_METHOD(Clear);
    static NAN_METHOD(Put);
    static NAN_METHOD(Get);
    static NAN_METHOD(RegisterAllKeys);
    static NAN_METHOD(UnregisterAllKeys);
    static NAN_METHOD(OnPut);
    static void AsyncGet(uv_work_t * request);
    static void AfterAsyncGet(uv_work_t * request, int status);
 private:
    gemfire::RegionPtr regionPtr;
    Persistent<Object> cacheHandle;
};

class GetBaton {
 public:
    GetBaton(Handle<Function> callback, Region * region, gemfire::CacheableKeyPtr keyPtr) :
        region(region),
        keyPtr(keyPtr) {
      NanAssignPersistent(this->callback, callback);
    }

    ~GetBaton() {
      NanDisposePersistent(callback);
    }

    Persistent<Function> callback;
    Region * region;
    gemfire::CacheableKeyPtr keyPtr;
    gemfire::CacheablePtr valuePtr;
};

}  // namespace node_gemfire

#define __REGION_HPP__
#endif
