// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/// @file hello_tutorial.cc
/// This example demonstrates loading, running and scripting a very simple NaCl
/// module.  To load the NaCl module, the browser first looks for the
/// CreateModule() factory method (at the end of this file).  It calls
/// CreateModule() once to load the module code.  After the code is loaded,
/// CreateModule() is not called again.
///
/// Once the code is loaded, the browser calls the CreateInstance()
/// method on the object returned by CreateModule().  It calls CreateInstance()
/// each time it encounters an <embed> tag that references your NaCl module.
///
/// The browser can talk to your NaCl module via the postMessage() Javascript
/// function.  When you call postMessage() on your NaCl module from the browser,
/// this becomes a call to the HandleMessage() method of your pp::Instance
/// subclass.  You can send messages back to the browser by calling the
/// PostMessage() method on your pp::Instance.  Note that these two methods
/// (postMessage() in Javascript and PostMessage() in C++) are asynchronous.
/// This means they return immediately - there is no waiting for the message
/// to be handled.  This has implications in your program design, particularly
/// when mutating property values that are exposed to both the browser and the
/// NaCl module.

#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_dictionary.h"
#include "ppapi/cpp/var_array_buffer.h"
#include "aes.h"
#include <inttypes.h>
#include <stdio.h>


uint64_t gcd(uint64_t a, uint64_t b) {
  while (a != 0 && b != 0) {
    while ((b & 1) == 0) {
      b >>= 1;
    }
    while ((a & 1) == 0) {
      a >>= 1;
    }
    if (a > b) {
      a -= b;
    } else {
      b -= a;
    }
  }
  return b == 0 ? a : b;
}

/// The Instance class.  One of these exists for each instance of your NaCl
/// module on the web page.  The browser will ask the Module object to create
/// a new Instance for each occurrence of the <embed> tag that has these
/// attributes:
///     src="hello_tutorial.nmf"
///     type="application/x-pnacl"
/// To communicate with the browser, you must override HandleMessage() to
/// receive messages from the browser, and use PostMessage() to send messages
/// back to the browser.  Note that this interface is asynchronous.
class MtprotoCryptoInstance : public pp::Instance {
 public:
  /// The constructor creates the plugin-side instance.
  /// @param[in] instance the handle to the browser-side plugin instance.
  explicit MtprotoCryptoInstance(PP_Instance instance) : pp::Instance(instance)
  {}

  virtual ~MtprotoCryptoInstance() {}

  /// Handler for messages coming in from the browser via postMessage().  The
  /// @a var_message can contain be any pp:Var type; for example int, string
  /// Array or Dictinary. Please see the pp:Var documentation for more details.
  /// @param[in] var_message The message posted by the browser.
  virtual void HandleMessage(const pp::Var& var_message) {

    if (!var_message.is_dictionary()) {
      return;
    }

    pp::VarDictionary request = pp::VarDictionary::VarDictionary(var_message);

    pp::Var varTaskID = request.Get(pp::Var::Var("taskID"));
    pp::Var varTask = request.Get(pp::Var::Var("task"));
    if (!varTaskID.is_int()) {
      return;
    }

    int32_t intTaskID = varTaskID.AsInt();
    std::string strTask = varTask.AsString();
    pp::Var varResult;

    if (strTask == "aes-encrypt") {
      pp::Var varData = request.Get(pp::Var::Var("bytes"));
      pp::Var varKey = request.Get(pp::Var::Var("keyBytes"));
      pp::Var varIv = request.Get(pp::Var::Var("ivBytes"));

      if (!varData.is_array_buffer() || !varKey.is_array_buffer() || !varIv.is_array_buffer()) {
        return;
      }

      pp::VarArrayBuffer abData = pp::VarArrayBuffer::VarArrayBuffer(varData);
      pp::VarArrayBuffer abKey = pp::VarArrayBuffer::VarArrayBuffer(varKey);
      pp::VarArrayBuffer abIv = pp::VarArrayBuffer::VarArrayBuffer(varIv);

      char* what = static_cast<char*>(abData.Map());
      char* keyBuff = static_cast<char*>(abKey.Map());
      char* ivBuff = static_cast<char*>(abIv.Map());
      int length = abData.ByteLength();

      AES_KEY akey;
      AES_set_encrypt_key((const unsigned char *) keyBuff, 32 * 8, &akey);
      AES_ige_encrypt((const unsigned char *)what, (unsigned char *)what, length, &akey, (unsigned char *)ivBuff, AES_ENCRYPT);

      varResult = abData;

    }
    else if (strTask == "aes-decrypt") {
      pp::Var varData = request.Get(pp::Var::Var("encryptedBytes"));
      pp::Var varKey = request.Get(pp::Var::Var("keyBytes"));
      pp::Var varIv = request.Get(pp::Var::Var("ivBytes"));

      if (!varData.is_array_buffer() || !varKey.is_array_buffer() || !varIv.is_array_buffer()) {
        return;
      }

      pp::VarArrayBuffer abData = pp::VarArrayBuffer::VarArrayBuffer(varData);
      pp::VarArrayBuffer abKey = pp::VarArrayBuffer::VarArrayBuffer(varKey);
      pp::VarArrayBuffer abIv = pp::VarArrayBuffer::VarArrayBuffer(varIv);

      char* what = static_cast<char*>(abData.Map());
      char* keyBuff = static_cast<char*>(abKey.Map());
      char* ivBuff = static_cast<char*>(abIv.Map());
      int length = abData.ByteLength();

      AES_KEY akey;
      AES_set_decrypt_key((const unsigned char *) keyBuff, 32 * 8, &akey);
      AES_ige_encrypt((const unsigned char *)what, (unsigned char *)what, length, &akey, (unsigned char *)ivBuff, AES_DECRYPT);

      varResult = abData;

    }
    else if (strTask == "factorize") {

      pp::Var varBytes = request.Get(pp::Var::Var("bytes"));
      if (!varBytes.is_array()) {
        return;
      }

      pp::VarArray aBytes = pp::VarArray::VarArray(varBytes);
      int length = aBytes.GetLength();
      if (length > 8) {
        return;
      }

      uint64_t what = 0;
      for (int i = 0; i < length; i++) {
        what += (uint64_t) aBytes.Get(length - i - 1).AsInt() << (i * 8);
      }

      int it = 0, i, j;
      uint64_t g = 0;
      for (i = 0; i < 3 || it < 1000; i++) {
        int q = ((lrand48() & 15) + 17) % what;
        uint64_t x = (long long)lrand48() % (what - 1) + 1, y = x;
        int lim = 1 << (i + 18), j;
        for(j = 1; j < lim; j++) {
          ++it;
          uint64_t a = x, b = x, c = q;
          while (b) {
            if (b & 1) {
              c += a;
              if (c >= what) {
                c -= what;
              }
            }
            a += a;
            if (a >= what) {
              a -= what;
            }
            b >>= 1;
          }
          x = c;
          uint64_t z = x < y ? what + x - y : x - y;
          g = gcd(z, what);
          if (g != 1) {
            break;
          }
          if (!(j & (j - 1))) {
            y = x;
          }
        }
        if (g > 1 && g < what) {
          break;
        }
      }
      uint64_t p = what / g;
      pp::VarArray pBytesArray = pp::VarArray::VarArray();
      int index = 0;
      for (int i = 0; i < 8; i++) {
        unsigned char byte = p >> ((8 - i - 1) * 8) & 0xFF;
        if (byte > 0 || index > 0) {
          pBytesArray.Set(index, pp::Var::Var((int)byte));
          index++;
        }
      }

      index = 0;
      pp::VarArray gBytesArray = pp::VarArray::VarArray();
      for (i = 0; i < 8; i++) {
        unsigned char byte = g >> ((8 - i - 1) * 8) & 0xFF;
        if (byte > 0 || index > 0) {
          gBytesArray.Set(index, pp::Var::Var((int)byte));
          index++;
        }
      }

      pp::VarArray varResultArray = pp::VarArray::VarArray();
      if (p < g) {
        varResultArray.Set(0, pBytesArray);
        varResultArray.Set(1, gBytesArray);
      } else {
        varResultArray.Set(1, pBytesArray);
        varResultArray.Set(0, gBytesArray);
      }

      varResult = varResultArray;
    }
    else {
      varResult = pp::Var::Var();
    }

    pp::VarDictionary response = pp::VarDictionary::VarDictionary();
    response.Set(pp::Var::Var("taskID"), varTaskID);
    response.Set(pp::Var::Var("result"), varResult);

    PostMessage(response);
  }
};

/// The Module class.  The browser calls the CreateInstance() method to create
/// an instance of your NaCl module on the web page.  The browser creates a new
/// instance for each <embed> tag with type="application/x-pnacl".
class MtprotoCryptoModule : public pp::Module {
 public:
  MtprotoCryptoModule() : pp::Module() {}
  virtual ~MtprotoCryptoModule() {}

  /// Create and return a MtprotoCryptoInstance object.
  /// @param[in] instance The browser-side instance.
  /// @return the plugin-side instance.
  virtual pp::Instance* CreateInstance(PP_Instance instance) {
    return new MtprotoCryptoInstance(instance);
  }
};

namespace pp {
/// Factory function called by the browser when the module is first loaded.
/// The browser keeps a singleton of this module.  It calls the
/// CreateInstance() method on the object you return to make instances.  There
/// is one instance per <embed> tag on the page.  This is the main binding
/// point for your NaCl module with the browser.
Module* CreateModule() {
  return new MtprotoCryptoModule();
}
}  // namespace pp
