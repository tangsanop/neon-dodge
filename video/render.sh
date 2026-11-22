#!/bin/bash
# Renders the video for the bounty "The agent builds a game from one prompt".
# 16:9, 1920x1080, ~41 s: hook + prompt -> agent working -> real gameplay
# -> make.fun referral end card (transparent webm from the press pack) with
# the referral code yt1awwmr typed into its field.
set -e
cd "$(dirname "$0")"

BOLD=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
MONO=/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf
JB=./JetBrainsMono-Bold.ttf
REC=$(ls page@*.webm | head -1)
CODE=yt1awwmr

# ---------- stage 1: intro (14 s) ----------
# 0-1.6s hook, 1.6-8s the prompt typing out, 8-14s the agent working.
ffmpeg -v error -y -f lavfi -i "color=c=0x05030f:s=1920x1080:r=30:d=14" -filter_complex "
[0:v]
drawbox=x=0:y=0:w=1920:h=10:color=0xff2d78:t=fill,
drawbox=x=0:y=1070:w=1920:h=10:color=0x00e5ff:t=fill,
drawtext=fontfile=$BOLD:text='I gave my AI agent':fontsize=76:fontcolor=white:x=(w-text_w)/2:y=400:alpha='if(lt(t,0.4),t/0.4,1)':enable='between(t,0,1.6)',
drawtext=fontfile=$BOLD:text='ONE PROMPT.':fontsize=130:fontcolor=0xff2d78:x=(w-text_w)/2:y=500:alpha='if(lt(t-0.25,0.4),(t-0.25)/0.4,1)':enable='between(t,0.25,1.6)',
drawbox=x=160:y=270:w=1600:h=470:color=0x0d0a24:t=fill:enable='between(t,1.6,8)',
drawbox=x=160:y=270:w=1600:h=470:color=0xff2d78:t=4:enable='between(t,1.6,8)',
drawtext=fontfile=$MONO:text='THE PROMPT':fontsize=34:fontcolor=0x7df9ff:x=200:y=300:enable='between(t,1.6,8)',
drawtext=fontfile=$MONO:text='Build a tiny neon arcade game\:':fontsize=40:fontcolor=white:x=200:y=360:enable='between(t,1.9,8)',
drawtext=fontfile=$MONO:text='steer a glowing ship\, dodge falling':fontsize=40:fontcolor=white:x=200:y=422:enable='between(t,2.9,8)',
drawtext=fontfile=$MONO:text='asteroids\, collect stars for points':fontsize=40:fontcolor=white:x=200:y=484:enable='between(t,3.9,8)',
drawtext=fontfile=$MONO:text='3 lives\, score\, game over screen.':fontsize=40:fontcolor=white:x=200:y=546:enable='between(t,4.9,8)',
drawtext=fontfile=$MONO:text='One HTML file\, no libraries.':fontsize=40:fontcolor=white:x=200:y=608:enable='between(t,5.9,8)',
drawbox=x=160:y=270:w=1600:h=470:color=0x0d0a24:t=fill:enable='between(t,8,14)',
drawbox=x=160:y=270:w=1600:h=470:color=0x00e5ff:t=4:enable='between(t,8,14)',
drawtext=fontfile=$MONO:text='THE AGENT, WORKING':fontsize=34:fontcolor=0x7df9ff:x=200:y=300:enable='between(t,8,14)',
drawtext=fontfile=$MONO:text='> writing game/index.html ......... OK':fontsize=38:fontcolor=0x7dffa8:x=200:y=380:enable='between(t,8.3,14)',
drawtext=fontfile=$MONO:text='> ship + asteroids + stars ........ OK':fontsize=38:fontcolor=0x7dffa8:x=200:y=442:enable='between(t,9.3,14)',
drawtext=fontfile=$MONO:text='> playtesting in headless Chrome .. OK':fontsize=38:fontcolor=0x7dffa8:x=200:y=504:enable='between(t,10.3,14)',
drawtext=fontfile=$MONO:text='> 0 console errors ................ OK':fontsize=38:fontcolor=0x7dffa8:x=200:y=566:enable='between(t,11.3,14)',
drawtext=fontfile=$BOLD:text='GAME BUILT IN ONE SESSION':fontsize=72:fontcolor=white:borderw=2:bordercolor=0xff2d78:x=(w-text_w)/2:y=880:enable='between(t,12.2,14)',
fade=t=out:st=13.6:d=0.4
[intro]" -map "[intro]" -c:v libx264 -pix_fmt yuv420p -r 30 intro.mp4

# ---------- stage 2: gameplay (24 s, trimmed from the real recording) ----------
# Captions ride along the bottom while the bot plays.
ffmpeg -v error -y -ss 1.0 -i "$REC" -t 24 -filter_complex "
[0:v]fps=30,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,
drawtext=fontfile=$BOLD:text='WATCH IT PLAY':fontsize=54:fontcolor=white:box=1:boxcolor=0x05030f@0.65:boxborderw=22:x=(w-text_w)/2:y=940:enable='between(t,0,5)',
drawtext=fontfile=$BOLD:text='DODGE THE ASTEROIDS':fontsize=54:fontcolor=white:box=1:boxcolor=0x05030f@0.65:boxborderw=22:x=(w-text_w)/2:y=940:enable='between(t,5,11)',
drawtext=fontfile=$BOLD:text='GRAB THE STARS  +25':fontsize=54:fontcolor=0xffd23f:box=1:boxcolor=0x05030f@0.65:boxborderw=22:x=(w-text_w)/2:y=940:enable='between(t,11,17)',
drawtext=fontfile=$BOLD:text='3 LIVES. NO MERCY.':fontsize=54:fontcolor=white:box=1:boxcolor=0x05030f@0.65:boxborderw=22:x=(w-text_w)/2:y=940:enable='between(t,17,24)'
[gp]" -map "[gp]" -c:v libx264 -pix_fmt yuv420p -r 30 gameplay.mp4

# ---------- stage 3: concat intro + gameplay, add music ----------
printf "file 'intro.mp4'\nfile 'gameplay.mp4'\n" > concat.txt
ffmpeg -v error -y -f concat -safe 0 -i concat.txt -i music.wav -map 0:v -map 1:a \
  -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac -b:a 160k -shortest clip.mp4
echo "clip duration:"; ffprobe -v error -show_entries format=duration -of csv=p=0 clip.mp4

# ---------- stage 4: referral end card over the last 2.5 s (press-pack recipe) ----------
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 clip.mp4)
LEN=2.5; REST=1.433; CX=432; CY=694; CW=5; CH=77; MID=733; SIZE=62
T=$(awk "BEGIN{print $D-$LEN}")
ffmpeg -v error -y -i clip.mp4 -c:v libvpx-vp9 -i card-16x9.webm -filter_complex "
[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=30,format=yuva420p,split[clip][soft];
[soft]gblur=sigma=28,eq=saturation=0.35,fade=t=in:st=$T:d=0.8:alpha=1[soft];
[clip][soft]overlay[bg];
[1:v]format=yuva420p,setpts=PTS-STARTPTS+$T/TB[card];
[bg][card]overlay=eof_action=pass,
drawbox=x=$CX-2:y=$CY-2:w=$CW+4:h=$CH+4:color=white:t=fill:enable='gte(t,$T+$REST)',
drawtext=fontfile=$JB:text=$CODE:fontsize=$SIZE:fontcolor=0x191419:x=$CX:y=$MID-(ascent-descent)/2:enable='gte(t,$T+$REST)'[v]" \
  -map "[v]" -map 0:a -c:v libx264 -pix_fmt yuv420p -r 30 -crf 18 -c:a aac -b:a 160k -movflags +faststart clip_card.mp4

# ---------- stage 5: hold the final card frame 3 s so the code can be read ----------
ffmpeg -v error -y -sseof -0.1 -i clip_card.mp4 -frames:v 1 last.png
ffmpeg -v error -y -loop 1 -t 3 -i last.png -i card-16x9.png -ss 38 -t 3 -i music.wav -filter_complex "
[0:v][1:v]overlay=0:0,
drawbox=x=$CX-2:y=$CY-2:w=$CW+4:h=$CH+4:color=white:t=fill,
drawtext=fontfile=$JB:text=$CODE:fontsize=$SIZE:fontcolor=0x191419:x=$CX:y=$MID-(ascent-descent)/2[v]" \
  -map "[v]" -map 2:a -c:v libx264 -pix_fmt yuv420p -r 30 -crf 18 -c:a aac -b:a 160k hold.mp4

printf "file 'clip_card.mp4'\nfile 'hold.mp4'\n" > final_concat.txt
ffmpeg -v error -y -f concat -safe 0 -i final_concat.txt -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac -b:a 160k -movflags +faststart final.mp4
echo "FINAL:"; ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height -of default=nw=1 final.mp4
ls -la final.mp4
