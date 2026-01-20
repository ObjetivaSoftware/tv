import React, { useEffect, useState } from "react";
import { formatBRL } from "./utils/formatters";

// Usar variáveis de ambiente
const WS_URL =
  import.meta.env.VITE_WS_URL || "wss://apitv.gestorimob.com.br/ws";
const API_URL =
  import.meta.env.VITE_API_URL || "https://apitv.gestorimob.com.br";

function generateHash() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

const TVScreen = () => {
  const [hash, setHash] = useState(null);
  const [imoveis, setImoveis] = useState([]);
  const [currentImovelIndex, setCurrentImovelIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [connected, setConnected] = useState(false);
  const [showCode, setShowCode] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(8000);
  const [isPaused, setIsPaused] = useState(false);
  const [imobiliaria, setImobiliaria] = useState(null);

  useEffect(() => {
    let localHash = localStorage.getItem("tv_hash");
    if (!localHash) {
      localHash = generateHash();
      localStorage.setItem("tv_hash", localHash);
    }
    setHash(localHash);

    async function fetchImobiliaria() {
      try {
        const response = await fetch(`${API_URL}/tv?hash=${localHash}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();

        if (data.success && data.imobiliaria) {
          setImobiliaria(data.imobiliaria);
          return data.imobiliaria;
        }
      } catch (e) {
        console.error("Erro ao buscar imobiliaria:", e);
      }
      return null;
    }

    fetchImobiliaria()
      .then((imoData) => {
        const ws = new window.WebSocket(WS_URL);
        ws.onopen = () => {
          setConnected(true);
          ws.send(
            JSON.stringify({
              type: "register",
              hash: localHash,
              imobiliaria_codigo: imoData?.basico?.codigo,
            }),
          );
        };
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.type === "content") {
            if (data.comando === "pause") {
              setIsPaused((prev) => !prev);
              return;
            }

            if (data.comando === "velocidade") {
              const velocidadeValor =
                typeof data.valor === "string"
                  ? parseInt(data.valor)
                  : data.valor;
              if (
                typeof velocidadeValor === "number" &&
                !isNaN(velocidadeValor)
              ) {
                console.log("Velocidade recebida:", velocidadeValor);
                setRotationSpeed(velocidadeValor);
              } else if (data.valor === "aumentar" || data.valor === "+") {
                setRotationSpeed((prev) => Math.max(2000, prev - 2000));
              } else if (data.valor === "diminuir" || data.valor === "-") {
                setRotationSpeed((prev) => Math.min(20000, prev + 2000));
              } else {
                setRotationSpeed((prev) =>
                  prev > 8000
                    ? Math.max(2000, prev - 2000)
                    : Math.min(20000, prev + 2000),
                );
              }
              return;
            }
            if (data.comando === "aumentar") {
              setRotationSpeed((prev) => Math.max(2000, prev - 2000));
              return;
            }
            if (data.comando === "diminuir") {
              setRotationSpeed((prev) => Math.min(20000, prev + 2000));
              return;
            }
            if (data.comando === "sair" || data.comando === "encerrar") {
              setShowCode(true);
              setImoveis([]);
              setIsPaused(false);
              return;
            }

            if (data.content) {
              try {
                const parsedContent = JSON.parse(data.content);
                if (Array.isArray(parsedContent)) {
                  setImoveis(parsedContent);
                  setShowCode(false);
                  setCurrentImovelIndex(0);
                  setCurrentImageIndex(0);
                  setIsPaused(false);
                }
              } catch (e) {
                console.error("Erro ao parsear conteúdo:", e);
              }
            }
          }
        };
        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          if (isComponentMounted) setConnected(false);
        };

        ws.onclose = () => setConnected(false);
        return () => ws.close();
      })
      .catch((e) => {
        console.log("erro ao buscar imos");
        console.log(e);
      });
  }, []);

  useEffect(() => {
    if (!imobiliaria) {
      const reloadInterval = setInterval(() => {
        window.location.reload();
      }, 15000); // 15 segundos

      return () => clearInterval(reloadInterval);
    }
  }, [imobiliaria]);

  useEffect(() => {
    if (imoveis.length > 0 && !isPaused) {
      const interval = setInterval(() => {
        const currentImovel = imoveis[currentImovelIndex];
        console.log(currentImovel);
        const totalImagens = currentImovel.imagens?.length || 1;

        if (currentImageIndex < totalImagens - 1) {
          setCurrentImageIndex((prev) => prev + 1);
        } else {
          setCurrentImageIndex(0);
          setCurrentImovelIndex((prev) => (prev + 1) % imoveis.length);
        }
      }, rotationSpeed);
      return () => clearInterval(interval);
    }
  }, [imoveis, rotationSpeed, isPaused, currentImovelIndex, currentImageIndex]);

  if (showCode) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#0096FF",
          color: "#fff",
          fontFamily: "Arial, sans-serif",
          padding: "6vh",
        }}
      >
        {imobiliaria && (
          <div
            style={{
              position: "absolute",
              top: "4vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2vh",
            }}
          >
            {imobiliaria.basico.logo && (
              <img
                src={imobiliaria.basico.logo}
                alt="Logo"
                style={{
                  maxWidth: "9vw",
                  maxHeight: "12vh",
                  objectFit: "contain",
                  filter: "drop-shadow(0 0.5vh 1vh rgba(0,0,0,0.3))",
                }}
              />
            )}
            <div
              style={{
                fontSize: "1.3vw",
                fontWeight: "bold",
                textAlign: "center",
                textShadow: "0.2vh 0.2vh 0.4vh rgba(0,0,0,0.3)",
              }}
            >
              {imobiliaria.basico.fantasia}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3vh",
          }}
        >
          {!imobiliaria && (
            <h1 style={{ fontSize: "5vw", margin: 0, color: "gray" }}>
              Gestor TV
            </h1>
          )}
          <div
            style={{
              fontSize: "1.5vw",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            Código da TV:
            <div
              style={{
                background: "#fff",
                color: "#0096FF",
                padding: "1vh 2vw",
                borderRadius: "1vw",
                marginTop: "vh",
                fontSize: "2.0vw",
                fontWeight: "bold",
                letterSpacing: "0.4vw",
              }}
            >
              {hash}
            </div>
          </div>

          {imobiliaria && (
            <div
              style={{
                marginTop: "3vh",
                background: "rgba(0, 150, 255, 0.15)",
                padding: "2.5vh 3vw",
                borderRadius: "1.5vw",
                backdropFilter: "blur(10px)",
                maxWidth: "70vw",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "1.4vw",
                  marginBottom: "1.2vh",
                  opacity: 0.9,
                  fontWeight: "bold",
                }}
              >
                📍 {imobiliaria.localizacao.completo} 📍
              </div>
              {imobiliaria.contato.whatsappvenda && (
                <div
                  style={{
                    fontSize: "1.6vw",
                    fontWeight: "bold",
                    marginTop: "2vh",
                    marginBottom: "2vh",
                  }}
                >
                  📱 {imobiliaria.contato.whatsappvenda} 📱
                </div>
              )}
              {imobiliaria.contato.emails.venda && (
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "1.4vw",
                    opacity: 0.9,
                  }}
                >
                  ✉️ {imobiliaria.contato.emails.venda} ✉️
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: "1.5vw",
            color: connected ? "#4ade80" : "#8b0000",
            position: "absolute",
            bottom: "1vh",
            right: "1.0vw",
          }}
        >
          {connected ? "● Conectado" : "● Desconectado"}
        </div>
      </div>
    );
  }

  if (imoveis.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#1a1a1a",
          color: "#fff",
          fontSize: "3vw",
        }}
      >
        Aguardando imóveis...
      </div>
    );
  }

  const imovel = imoveis[currentImovelIndex];
  const imagemAtual =
    imovel.imagens?.[currentImageIndex] ||
    imovel.imagem ||
    `https://source.unsplash.com/1920x1080/?house,apartment,real-estate&sig=${currentImovelIndex}`;
  const totalImagens = imovel.imagens?.length || 1;

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url('${imagemAtual}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.7)",
          zIndex: 0,
          transition: "opacity 0.5s ease-in-out",
        }}
      />

      {isPaused && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 100,
            fontSize: "15vw",
            color: "rgba(255,255,255,0.8)",
            textShadow: "0 0 2vw rgba(0,0,0,0.8)",
          }}
        >
          ⏸
        </div>
      )}

      <div
        style={{
          position: "relative",
          zIndex: 10,
          padding: "3vh 4vw",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
        }}
      >
        {imobiliaria ? (
          <div style={{ display: "flex", alignItems: "center", gap: "2vw" }}>
            {imobiliaria.basico.logo && (
              <img
                src={imobiliaria.basico.logo}
                alt="Logo"
                style={{
                  maxHeight: "6vh",
                  objectFit: "contain",
                  filter: "drop-shadow(0 0.2vw 0.4vw rgba(0,0,0,0.8))",
                }}
              />
            )}
            <h1
              style={{
                color: "#fff",
                fontSize: "1vw",
                margin: 0,
                fontWeight: "bold",
                textShadow: "0.2vw 0.2vw 0.4vw rgba(0,0,0,0.8)",
              }}
            ></h1>
          </div>
        ) : (
          <h1
            style={{
              color: "#fff",
              fontSize: "vw",
              margin: 0,
              fontWeight: "bold",
              textShadow: "0.2vw 0.2vw 0.4vw rgba(0,0,0,0.8)",
            }}
          >
            Gestor Imobiliária
          </h1>
        )}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            backgroundColor: "#4D5A62",
            padding: "0vh 0vw",
            borderRadius: "0vw",
            width: "100%",
          }}
        >
          <h3
            style={{
              position: "relative",
              left: "12vh",
              top: "5vh",
              color: "#fff",
              fontSize: "2vw",
              margin: 0,
              fontWeight: "normal",
            }}
          >
            {imovel.acao}
          </h3>
          <h2
            style={{
              position: "relative",
              left: "12vh",
              top: "5vh",
              color: "#fff",
              fontSize: "2vw",
              margin: 0,
              fontWeight: "bold",
            }}
          >
            {imovel.titulo}
          </h2>

          <div
            style={{
              position: "relative",
              left: "12vh",
              top: "8vh",
              color: "#e5e7eb",
              fontSize: "1.6vw",
              letterSpacing: "0.02em",
              margin: 0,
              fontWeight: "normal",
              lineHeight: "1.4",
            }}
          >
            <span style={{ fontSize: "0.7em" }}>📍</span>
            {imovel.endereco}
          </div>

          <div
            style={{
              position: "absolute",
              top: "87%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "white",
              fontSize: "2.3vw",
              fontWeight: "bold",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "1.4",
                fontWeight: "normal",
                position: "relative",
                top: "-2vh",
                left: "3vh",
              }}
            >
              Valor:
            </p>
            <span
              style={{
                position: "absolute",
                top: "5vh",
                left: "-11vh",
                fontSize: "2.3vw",
                fontWeight: "bold",
                whiteSpace: "nowrap",
              }}
            >
              {(() => {
                if (
                  imovel.valor === null ||
                  imovel.valor === undefined ||
                  imovel.valor === ""
                ) {
                  return null;
                }

                const valorNumerico = Number(imovel.valor);

                const valorFormatado = formatBRL(imovel.valor);

                if (!isNaN(valorNumerico)) {
                  return <span> {valorFormatado}</span>;
                }

                return <span>{imovel.valor}</span>;
              })()}
            </span>
          </div>

          <div
            style={{
              color: "#d1d5db",
              fontSize: "1.5vw",
              fontWeight: "normal",
              paddingBottom: "14vh",
              lineHeight: "0",
              padding: "2vh 2vw 5vw 2vh",
              position: "relative",
              left: "-3vh",
              textAlign: "right",
            }}
          >
            {imovel.descricao}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "1vh",
          left: "55%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "1vw",
          zIndex: 20,
        }}
      >
        {Array.from({ length: totalImagens }).map((_, idx) => (
          <div
            key={idx}
            style={{
              width: idx === currentImageIndex ? "4vw" : "1.5vw",
              height: "0.8vh",
              background:
                idx === currentImageIndex
                  ? "rgba(255,255,255,0.3)"
                  : "rgba(255,255,255,0.3)",
              borderRadius: "0.3vh",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "0vh",
          right: "2vw",
          zIndex: 20,
          fontSize: "1vw",
          color: "rgba(255,255,255,0.7)",
          backgroundColor: "#4D5A62",
          padding: "0.8vh 1.2vw",
          borderRadius: "0.4vw",
          backdropFilter: "blur(8px)",
          display: "flex",
          gap: "0.8vw",
          alignItems: "center",
        }}
      >
        <span>
          Imóvel {currentImovelIndex + 1}/{imoveis.length}
        </span>
        <span style={{ opacity: 0.5 }}>•</span>
        <span>
          Foto {currentImageIndex + 1}/{totalImagens}
        </span>
        <span style={{ opacity: 0.5 }}>•</span>
        <span>⏱ {(rotationSpeed / 1000).toFixed(0)}s</span>
      </div>
    </div>
  );
};

export default TVScreen;
