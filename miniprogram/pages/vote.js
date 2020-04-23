// miniprogram/vote.js
//云数据库实例
let db = wx.cloud.database()
//图片列表集合
let vote = db.collection('vote')
//投票记录集合
let votes = db.collection('votes')
//数据聚合对象
let $ = db.command.aggregate
Page({
  data: {
    imglist: [], //图片列表
    voted: false //是否投过票
  },
  onLoad(options) {
    //调用云函数，获取openid
    wx.cloud.callFunction({
      name: 'login'
    }).then((res) => { //云函数的回调建议不使用success，而是then
      //读取投票记录集合，查找当前的openid，判断当前用户是否投过票
      votes.where({
        _openid: res.result.openid
      }).get()
        .then((res) => {
          this.setData({
            voted: !!res.data.length
          })
        })
    })
    // vote.get().then(res=>{
    //   console.log(res)
    //   this.setData({
    //     vote:res.data
    //   })
    // })
    //读取候选图片列表
    vote.get().then((res) => {

      let tlist = res.data //读取投票集合按fileid分组统计记录数量

      votes.aggregate()
        .group({
          _id: "$fileid",
          count: $.sum(1)
        }).end().then((res) => {
          //使用es6的array函数遍历和查找每张图片的已投票数量

          tlist.forEach((val) => {
            res.list.find((v) => {
              if (v._id == val.fileid)
                val.vote += v.count
            })
          })

          this.setData({
            imglist: tlist

          })
        })
    })
  },
  vote(event) {
    console.log(event.target.dataset.fileid)
    if (this.data.voted) {
      console.log(this.data.voted)
      wx.showToast({
        title: '已投票,不能再投',
      })
      return
    }
    else {
      let date = new Date()
      //向投票记录集合添加一条数据
      votes.add({
        data: {
          fileid: event.target.dataset.fileid,
          date: date
        }
      }).then((res) => {
        this.setData({
          voted: true
        })
        wx.showToast({
          title: '投票成功',
        })
      })
    }

  }
})