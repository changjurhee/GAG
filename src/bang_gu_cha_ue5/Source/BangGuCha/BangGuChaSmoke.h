#pragma once

#include "BangGuChaSmoke.generated.h"
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"

class UBoxComponent;
class UStaticMeshComponent;

UCLASS()
class BANGGUCHA_API ABangGuChaSmoke : public AActor {
  GENERATED_BODY()

public:
  ABangGuChaSmoke();

protected:
  virtual void BeginPlay() override;

public:
  virtual void NotifyActorBeginOverlap(AActor *OtherActor) override;

  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
  UBoxComponent *CollisionComp;

  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
  UStaticMeshComponent *MeshComp;

  UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
  float LifeSpan;
};
