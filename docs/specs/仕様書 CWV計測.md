---
title: 仕様書 CWV計測
source:
author:
published:
created: 2026-03-01
description: Core Web Vitals の計測手順・目標値・確認運用
tags:
---
# Core Web Vitals 計測

## 概要

`docs/specs/要件定義書` および `docs/specs/仕様書 機能` のパフォーマンス要件に基づき、Core Web Vitals（LCP/CLS/INP）の計測手順と確認運用を定義する。計測は手動で実施し、結果は `docs/manage/CWV計測チェック表.md` に記録する。

## 目標値（MVP, p75）

| 指標 | 目標値 | 判定基準 |
|------|--------|----------|
| LCP | ≤ 2.5s | Pass / Fail |
| CLS | ≤ 0.1 | Pass / Fail |
| INP | ≤ 200ms | Pass / Fail |

※ 75パーセンタイル（p75）で判定する。

## 計測ツール

### 1. Google PageSpeed Insights（ラボデータ）

- **URL**: https://pagespeed.web.dev/
- **種類**: Lighthouse（シミュレーション）
- **用途**: リリース前チェック、改善前後の比較、開発段階での確認

**手順**

1. ブラウザで PageSpeed Insights を開く
2. 計測対象URL（本番またはステージング）を入力
3. 「分析」を実行
4. 「Core Web Vitals」セクションで LCP / CLS / INP の値を確認
5. 結果をチェック表に記録

**補足**

- モバイル・デスクトップ双方の計測が可能
- ラボ環境のため実ユーザー環境とは差異があり得る

### 2. Vercel Speed Insights（フィールドデータ）

- **場所**: Vercel ダッシュボード > プロジェクト > Speed Insights
- **種類**: RUM（Real User Monitoring）
- **用途**: 本番環境における実ユーザーの CWV 確認

**手順**

1. Vercel にログインし、対象プロジェクトを選択
2. 「Speed Insights」タブを開く
3. LCP / CLS / INP の分布（p75 等）を確認
4. 結果をチェック表に記録

**補足**

- データ収集は `@vercel/speed-insights` 導入により自動で行われる
- トラフィック量が少ない場合はデータが十分に集まらない場合がある

## 計測対象

- **本番URL**: デプロイ済みの本番環境（例: `https://mono-log.vercel.app/`）
- **主要ページ**: トップ（未ログイン/ログイン中）、投稿一覧、ごみ箱など必要に応じて追加

## 確認タイミング

- 本番リリース前
- 大きな機能追加・変更後のデプロイ時
- 定期的なモニタリング（四半期等、運用で決定）

## 改善ループ

1. 計測を実施し、チェック表に結果を記録する
2. 目標値未達の場合は「課題・改善メモ」に未達項目・仮説・改善方針を記入する
3. 改善を実施する（画像最適化、遅延読み込み、レイアウト安定化など）
4. 改善後に再計測を行い、結果を記録する
5. 目標達成まで 2〜4 を繰り返す

## 関連ドキュメント

- `docs/specs/要件定義書.md` … パフォーマンス要件
- `docs/specs/仕様書 機能.md` … パフォーマンス・計測方針
- `docs/manage/CWV計測チェック表.md` … 計測結果・課題の記録
