/**
 * **********************************************************************
 * 说明：定义HashMap对象  链表对象  缓存对象LRU策略
 * 调用方式：
 *   localCache.put(key, value);
 * **********************************************************************
 */
/**
 * HashMap对象
 * @constructor
 */
function _HashMap () {
  //定义长度
  var length = 0;
  //创建一个对象
  var obj    = new Object();
  /**
   * 判断Map是否为空
   */
  this.isEmpty = function() {
    return length == 0;
  };
  /**
   * 判断对象中是否包含给定Key
   */
  this.containsKey = function( key ) {
    return (key in obj);
  };
  /**
   * 判断对象中是否包含给定的Value
   */
  this.containsValue = function( value ) {
    for ( var key in obj ) {
      if ( obj[ key ] == value ) {
        return true;
      }
    }
    return false;
  };
  /**
   *向map中添加数据
   */
  this.put = function( key, value ) {
    if ( !this.containsKey( key ) ) {
      length++;
    }
    obj[ key ] = value;
  };
  /**
   * 根据给定的Key获得Value
   */
  this.get = function( key ) {
    var data = this.containsKey( key ) ? obj[ key ] : null;
    return data;
  };
  /**
   * 根据给定的Key删除一个值
   */
  this.remove = function( key ) {
    if ( this.containsKey( key ) && (delete obj[ key ]) ) {
      length--;
    }
  };
  /**
   * 获得Map中的所有Value
   */
  this.values = function() {
    var _values = new Array();
    for ( var key in obj ) {
      _values.push( { key:obj[ key ].key, value:obj[ key ].value } );
    }
    return _values;
  };
  /**
   * 获得Map中的所有Key
   */
  this.keySet = function() {
    var _keys = new Array();
    for ( var key in obj ) {
      _keys.push( key );
    }
    return _keys;
  };
  /**
   * 获得Map的长度
   */
  this.size = function() {
    return length;
  };
  /**
   * 清空Map
   */
  this.clear = function() {
    length = 0;
    obj    = new Object();
  };
}
/**
 * 链表节点
 */
function CacheNode () {
  this.prev;//前一节点
  this.next;//后一节点
  this.value;//值
  this.key;//键
}
/**
 * 缓存对象
 * @param _cacheName 缓存名
 * @param _cacheSize 缓存个数
 * @param _localStorageSize 缓存数据的大小M单位
 * @constructor
 */
function LRUCache ( _cacheName, _cacheSize, _localStorageSize ) {
  var first;//链表头
  var last;//链表尾
  var currentSize      = 0; // 当前大小
  var cacheSize        = _cacheSize; //缓存大小
  var localStorageSize = _localStorageSize;
  var nodes            = new _HashMap();//缓存容器
  var cacheName        = sha1( _cacheName );
  var localStorage = window.localStorage || {
      getItem:function() {
        return null;
      },
      setItem:function() {
      }
    }; // 缓存全局localStorage对象局部变量
 
  /**
   * 加载localStorage中的数据
   */
  function init () {
    var cacheArray = JSON.parse( localStorage.getItem( cacheName ) || '[]' );
    if ( cacheArray ) {
      cacheArray = cacheArray.reverse();
      for ( var i = 0, len = cacheArray.length; i < len; i++ ) {
        add( cacheArray[ i ].key, cacheArray[ i ].value );
      }
    }
  }
  
  init();
  
  /**
   * hash加密->sha1算法
   * @param str
   */
  function sha1 ( str ) {
    return CryptoJS.SHA1( str ).toString();
  }
  
  /**
   * 获取缓存中对象
   * @param key
   * @return
   */
  function get ( key ) {
    key      = sha1( key );
    var node = nodes.get( key );
    if ( node != null ) {
      moveToHead( node );
      return node.value;
    } else {
      return null;
    }
  }
  
  /**
   * 获取字符串长度（汉字算两个字符，字母数字算一个）
   * @author @DYL
   * @DATE 2017-11-21
   */
  function getByteLen ( val ) {
    var len = 0;
    for ( var i = 0; i < val.length; i++ ) {
      var a = val.charAt( i );
      if ( a.match( /[^\x00-\xff]/ig ) != null ) {
        len += 2;
      }
      else {
        len += 1;
      }
    }
    return len;
  }
  
  /**
   * 把数据保存到localStorage中
   * @param obj Object类型
   */
  function saveLocalStorage ( obj ) {
    var jsonString = JSON.stringify( obj ); //将对象转换成字符JSON
    var byte       = getByteLen( jsonString ); //字节
    var kb         = byte / 1024; // K字节
    var mb         = kb / 1024; //兆M
    if ( mb > localStorageSize ) {
      removeLast(); // 删除后一个缓存数据，再次进入saveLocalStorage，以后计划递归，知道小于localStorageSize的大小
    } else {
      localStorage.setItem( cacheName, jsonString );
    }
  }
  
  /**
   * 内部添加数据，并未添加到本地缓存中localStorage
   * @param key
   * @param value
   */
  function add ( key, value ) {
    var node = nodes.get( key );
    if ( node == null ) {
      //缓存容器是否已经超过大小.
      if ( currentSize >= cacheSize ) {
        if ( last != null ) {
          //将最少使用的删除
          nodes.remove( last.key );
        }
        removeLast();
      } else {
        currentSize++;
      }
      node = new CacheNode();
    }
    node.value = value;
    node.key   = key;
    //将最新使用的节点放到链表头，表示最新使用的.
    moveToHead( node );
    nodes.put( key, node );
  }
  
  /**
   * 添加缓存
   * @param key
   * @param value
   */
  function put ( key, value ) {
    key = sha1( key );
    add( key, value );
    saveLocalStorage( nodes.values() );
  }
  
  /**
   * 将缓存删除
   * @param key
   * @return
   */
  function remove ( key ) {
    key      = sha1( key );
    var node = nodes.get( key );
    if ( node != null ) {
      if ( node.prev != null ) {
        node.prev.next = node.next;
      }
      if ( node.next != null ) {
        node.next.prev = node.prev;
      }
      if ( last == node )
        last = node.prev;
      if ( first == node )
        first = node.next;
      nodes.remove( key );
      saveLocalStorage( nodes.values() );
    }
    return node;
  }
  
  /**
   * 清仓缓存cachaName中的数据
   */
  function clear () {
    first = null;
    last  = null;
    nodes.clear();//清除hashMap
    saveLocalStorage( nodes.values() );
  }
  
  /**
   * 删除链表尾部节点
   *  表示 删除最少使用的缓存对象
   */
  function removeLast () {
    //链表尾不为空,则将链表尾指向null. 删除连表尾（删除最少使用的缓存对象）
    if ( last != null ) {
      nodes.remove( last.key );
      console.log( nodes.values() );
      if ( last.prev != null ) {
        last.prev.next = null;
      } else {
        first = null;
      }
      last = last.prev;
      saveLocalStorage( nodes.values() );
    }
  }
  
  /**
   * 移动到链表头，表示这个节点是最新使用过的
   * @param node
   */
  function moveToHead ( node ) {
    if ( node == first )
      return;
    if ( node.prev != null )
      node.prev.next = node.next;
    if ( node.next != null )
      node.next.prev = node.prev;
    if ( last == node )
      last = node.prev;
    if ( first != null ) {
      node.next  = first;
      first.prev = node;
    }
    first     = node;
    node.prev = null;
    if ( last == null ) {
      last = first;
    }
  }
  
  this.get        = get;
  this.put        = put;
  this.remove     = remove;
  this.clear      = clear;
  this.removeLast = removeLast;
  this.moveToHead = moveToHead;
}
window.localCache = new LRUCache( "localCache", 500, 4.5 );



