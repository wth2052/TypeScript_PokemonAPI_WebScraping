// require => import 로 변경
// 크롤링하기위한 puppeteer 모듈 불러오기
import puppeteer from "puppeteer";
// 데이터를 저장하기위해 fs 모듈 불러오기
import fs from "fs";

interface ICard {
  id: string;
  image: string;
  name: string;
  details: string;
}

async function scrape(): Promise<ICard[]> {
  try {
    // 크로미움으로 브라우저를 연다.
    const browser = await puppeteer.launch();

    // 페이지 열기
    const page = await browser.newPage();

    // 링크 이동
    await page.goto("http://127.0.0.1:5500");

    // .card--id 의 값이 #100인 엘레먼트가 나타날때까지 대기
    await page.waitForFunction(
      () => {
        const cardId = document.querySelector(".card:last-child .card--id");
        return cardId && cardId.textContent === "#100";
      },
      { timeout: 5000 }
    );

    // cards 에 모든 카드정보 배열로 저장
    const cards = await page.$$(".card");
    // 100개의 카드가 잘 저장되었는지 확인.
    console.log(cards.length);
    const data: ICard[] = [];

    // cards 돌면서 필요한 데이터 수집
    // data 배열에 수집한 데이터 등록
    for (const card of cards) {
      const id = await card.$eval(".card--id", (el) => el.textContent);
      const image = await card.$eval(".card--image", (el) =>
        el.getAttribute("src")
      );
      const name = await card.$eval(".card--name", (el) => el.textContent);
      const details = await card.$eval(
        ".card--details",
        (el) => el.textContent
      );
      if (id && image && name && details) {
        data.push({ id, image, name, details });
      } else {
        console.log("id, image, name, details 값이 모두 들어오지 않았습니다.");
        return [];
      }
    }

    // 페이지와 브라우저 종료
    await page.close();
    await browser.close();

    // data 리턴 => 리턴한 데이터를 받아서 파일로 쓰기 위함.
    return data;
  } catch (error) {
    console.log(error);
    return [];
  }
}

scrape()
  .then((data) => {
    fs.writeFile("cards.json", JSON.stringify(data), "utf8", (error) => {
      if (error) {
        console.log("파일 생성 중 에러 발생.");
        return console.log(error);
      }
      console.log("파일 생성 완료!");
    });
  })
  .catch((error) => console.log(error));